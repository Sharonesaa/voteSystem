import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateUserDto} from "src/dto/createUser.dto";
import { User } from "src/entities/user.entity";
import { In, Repository } from "typeorm";
import * as bcrypt from "bcrypt"
import { Role } from "src/entities/roles.entity";
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { MailService } from "../mail/mail.service";
import { generateRandomPassword } from "src/helpers/password.helper"
import { OrganizationalStructure} from "src/entities/organizationalStructure.entity";
import { updateUserDto } from "src/dto/updateUserDto";
import { log } from "console";
import { Group } from "src/entities/group.entity";

// import { Account } from "src/entities/account.entity";


@Injectable()
export class UserService{
  private isCreatingUser = false;
  
  constructor(
    @InjectRepository(Group) // Asegúrate de que todos los repositorios sean inyectados correctamente
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role) 
    private roleRepository: Repository<Role>,
    private readonly mailService: MailService,
    @InjectRepository(OrganizationalStructure)
    private structureRepository: Repository<OrganizationalStructure>,
    // @InjectRepository(Account) private readonly accountRepository:Repository<Account>,
  ) {}


  async getUsers(parentId?: string): Promise<User[]> {
    try {
      if (parentId) {
        const parentUser = await this.userRepository.findOne({ where: { id: parentId } });
  
        if (!parentUser) {
          throw new NotFoundException(`User with id ${parentId} not found`);
        }
  // Obtén las relaciones donde este usuario es el padre
        const childRelations = await this.structureRepository.find({
          where: { parent: parentUser }, // Usando la relación
          relations: ['child'], // Carga la relación child
        });

        const childIds = childRelations.map(rel => rel.child.id); 
      
        if (childIds.length > 0) {
          return await this.userRepository.find({
            where: { id: In(childIds) },
            relations: ['roles'], 
          });
        } else {
          return []; 
        }
      }
      return await this.userRepository.find({relations: ['roles']});
    } catch (error) {
      throw new InternalServerErrorException('Error retrieving users');
    }
  }

  async assignPackageToUser(userId: string, packageId : number): Promise<User> {
   
    const user = await this.userRepository.findOne({ where: { id: userId } });

   
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // const selectedPackage = await this.accountRepository.findOne({where:{id:packageId}});
   
    // if (!user.accounts.some(account => account.id === selectedPackage.id)) {
    //   user.accounts.push(selectedPackage);
    // } else {
    //   throw new ConflictException('Package already assigned to user');
    // }
    // await this.userRepository.save(user);

    
    return user;
  }
  
  
  async deteleUserById(id: string):Promise <string> {
    try {
      const userToRemove = await this.userRepository.findOneBy({id})
    if(userToRemove){
      await this.userRepository.remove(userToRemove)
      return `User with id: ${id} successfully deleted`
    }else{
      throw new NotFoundException(`User with id: ${id} not found`)
    }
    } catch (error) {
      throw new InternalServerErrorException('Error deleting user')
    }
    
  }


  async updateUserById(id: string, createUserDto: updateUserDto): Promise<Omit<User, 'password'>> {
    try { 
      // Buscar el usuario por su ID, incluyendo la relación 'roles'
      const userToUpdate = await this.userRepository.findOne({ where: { id }, relations: ['roles'] });
      if (!userToUpdate) {
        throw new NotFoundException(`User with id: ${id} not found`);
      }
  
      // Actualizar otros campos del usuario
      Object.assign(userToUpdate, createUserDto);
  
      // Si hay roles en el DTO, agregarlos a los roles actuales
      if (createUserDto.roles && createUserDto.roles.length > 0) {
        // Buscar los roles por sus IDs
        const rolesToAdd = await this.roleRepository.findByIds(createUserDto.roles);
        if (rolesToAdd.length === 0) {
          throw new NotFoundException('Roles not found');
        }
  
        // Agregar los roles nuevos a los existentes
        const existingRoles = userToUpdate.roles || [];
        userToUpdate.roles = [...existingRoles, ...rolesToAdd].filter(
          (role, index, self) => self.findIndex(r => r.id === role.id) === index
        ); // Asegurar que no haya duplicados
      }
  
      // Guardar el usuario actualizado
      const updatedUser = await this.userRepository.save(userToUpdate);
  
      // Omitir la contraseña en el retorno del usuario actualizado
      const { password, ...userToShow } = updatedUser;
      return {
        ...userToShow,
        roles:userToShow.roles
      };
  
    } catch (error) {
      console.error(`Error updating user with id ${id}:`, error);
      throw new InternalServerErrorException('Error updating user');
    }
  }
  
  
  

  async getUserById(id: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        relations: { candidate: true, roles:true, groups:true},
      })

      if (!user) {
        throw new NotFoundException(`User with id: ${id} not found`)
      }
      const { password, ...userToShow } = user
      return userToShow
    } catch (error) {
      throw new InternalServerErrorException('Error retrieving user')
    }
  }
 

  async findUserByEmail(email:string):Promise<User>{
    return await this.userRepository.findOne({ where: { email } });
    } 
  

  async findUserByDni(dni:number):Promise<User>{ 
    const user = await this.userRepository.findOneBy({dni}); 
   if(!user){
    throw new NotFoundException(`user not found`)
   }
   return user;
  }


  async createUser(
    createUserDto: CreateUserDto,
    parentId?: string,
): Promise<Omit<User, 'password'>> {
    if (this.isCreatingUser) {
        throw new ConflictException('User creation is already in progress.');
    }
    
    this.isCreatingUser = true;

    try {

        const user = await this.userRepository.findOneBy({
            dni: createUserDto.dni,
        });
        if (user) {
            throw new UnauthorizedException(`User with dni: ${createUserDto.dni} already exists`);
        }
        
    
        const userByEmail = await this.userRepository.findOneBy({
            email: createUserDto.email,
        });
        if (userByEmail) {
            throw new UnauthorizedException(`User with email: ${createUserDto.email} already exists`);
        }

        // Generación de contraseña y encriptación
        const passwordGenerated = !createUserDto.password;
        const password = createUserDto.password || generateRandomPassword();
        const hashedPassword = await bcrypt.hash(password, 10);

        // Roles y cuentas por defecto
        const defaultRole = await this.roleRepository.findOne({ where: { id: 3 } });
        if (!defaultRole) {
            throw new BadRequestException('Default role not found');
        }

        let userRoles: Role[] = [defaultRole];
        if (createUserDto.roles && createUserDto.roles.length > 0) {
            userRoles = await this.roleRepository.findBy({
                id: In(createUserDto.roles),
            });
            if (userRoles.length !== createUserDto.roles.length) {
                throw new BadRequestException('Some roles not found');
            }
        }

        // const withoutAccount = await this.accountRepository.findOne({
        //     where: { id: 0 },
        // });
        // if (!withoutAccount) {
        //     throw new BadRequestException('Default account not found');
        // }

        let newUser = this.userRepository.create({
            ...createUserDto,
            password: hashedPassword,
            roles: userRoles,
            // accounts: [withoutAccount],
            isFirstLogin: !passwordGenerated ? false : undefined,
        });

        if (createUserDto.groupId && createUserDto.groupId.length > 0) {
          const groups = await this.groupRepository.findBy({
              id: In(createUserDto.groupId),   
          });
      
          if (groups.length !== createUserDto.groupId.length) {
              throw new BadRequestException('Some groups not found');
          }
      
          newUser.groups = groups;  // Asigna los grupos al usuario
      }

      // Guardar el nuevo usuario con los grupos asociados
      await this.userRepository.save(newUser);

        await this.userRepository.save(newUser);

        // Enviar el correo de bienvenida
        await this.mailService.sendWelcomeEmail(newUser.email, newUser.name, password);

        // Manejo de la relación con parentId
        if (parentId) {
            const parentUser = await this.userRepository.findOneBy({ id: parentId });
            if (!parentUser) {
                throw new BadRequestException(`Parent user with id: ${parentId} not found`);
            }
            const existingRelation = await this.structureRepository.findOne({
                where: { child: { id: newUser.id } },
            });
            if (existingRelation) {
                throw new BadRequestException(`User with id: ${newUser.id} is already related to another parent`);
            }
            const structureRelation = this.structureRepository.create({
                parent: parentUser,
                child: newUser,
            });
            await this.structureRepository.save(structureRelation);
        }

        const { password: excludedPassword, ...result } = newUser;
        return result;
    } catch (error) {
        console.error('Error during user creation:', error);
        throw error; // O manejarlo según tus necesidades
    } finally {
        this.isCreatingUser = false; // Reset flag after processing.
    }
}

  async readExcelFile(filePath: string): Promise<CreateUserDto[]> {
    const data = fs.readFileSync(filePath);
    const workbook = XLSX.read(data, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    const users: CreateUserDto[] = [];
  
    sheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<CreateUserDto>(worksheet);
      users.push(...jsonData);
    });
  
    return users;
  }
  
  async importUsers(
    filePath: string, 
    parentId: string
  ): Promise<{ addedUsers: string[], errors: string[] }> {
    if (!filePath) {
      throw new BadRequestException('File not selected');
    }
  
    const users = await this.readExcelFile(filePath);
    const addedUsers: string[] = [];
    const errors: string[] = [];
  
    for (const user of users) {
      const missingFields = this.validateUserFields(user);
      if (missingFields.length > 0) {
        errors.push(`Fallo en carga de datos del usuario ${user.email} (Nombre: ${user.name || 'N/A'}, DNI: ${user.dni || 'N/A'}): faltan los siguientes campos: ${missingFields.join(', ')}, registrar manualmente`);
        continue;
      }
  
      const existingUser = await this.findUserByEmailxlsx(user.email);
      if (!existingUser) {
        try {
          await this.createUser(user, parentId);
          addedUsers.push(user.email);
        } catch (err) {
          errors.push(`Fallo en la creación del usuario ${user.email}: ${err.message}`);
        }
      } else {
        errors.push(`El usuario ${user.email} (Nombre: ${user.name || 'N/A'}, DNI: ${user.dni || 'N/A'}) ya existe.`);
      }
    }
  
    return {
      addedUsers,
      errors  
    };
  }
  private validateUserFields(user: CreateUserDto): string[] {
    const missingFields = [];
  
    if (!user.name) missingFields.push('nombre');
    if (!user.dni) missingFields.push('dni');
    if (!user.email) missingFields.push('correo');
  
    return missingFields;
  }
  

  async findUserByEmailxlsx(email: string): Promise<User | undefined> {
    return await this.userRepository.findOne({ where: { email } });
  }


}