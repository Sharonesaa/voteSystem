// 'use client';
// import { validateFields } from '@/helpers/validateLogin';
// import { IloginError, IloginProps } from '@/interfaces/ILogin';
// import { useRouter } from 'next/navigation';
// import React, { useEffect, useState } from 'react';
// import Image from 'next/image';
// import { login } from '@/helpers/auth.helper';
// import Swal from 'sweetalert2';
// import Input from '../ui/Input';
// import Boton from '../ui/Boton';
// import { useAuth } from '@/context/Authontext'; // Importa el contexto de autenticación
// import { changePassword } from '@/helpers/changePassword.helper';
// import { IChangePassword } from '@/interfaces/IChangePassword';

// const LoginForm = () => {
//     const router = useRouter();
//     const { setUserData } = useAuth(); // Obtiene setUserData desde el contexto
//     const initialState = {
//         dni: 0,
//         password: "",
//         newPassword:"",
//         confirmPassword:""
//     };

//     const [dataUser, SetdataUser] = useState<IChangePassword>(initialState);
//     //const [errors, SetErrors] = useState<IChangePassword>(initialState);
    
//     // CAPTURO LA INFORMACION DE LOS INPUTS
//     const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//         const { name, value } = event.target;
//         SetdataUser({
//             ...dataUser, [name]: value
//         });
//     };
    
//     // ENVIO LOS DATOS AL BACK O GUARDO LOS DATOS EN EL ARRAY   
//     const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
//         event.preventDefault();
        
       
//                 return;
//             }
//         }
    
//     // VERIFICO SI EXISTE ALGUN ERROR EN LA VALIDACION DE LOS INPUTS

//     /*useEffect(() => {
//         const errors = validateFields(dataUser);
//         SetErrors(errors);
//     }, [dataUser]);*/

     
//     return (
//         <div className='my-4 text-center flex flex-col items-center bg-white shadow-lg px-4 rounded-lg'>
//             <Image src="/images/logo.png" alt="imagenLogo" width={350} height={350} className='m-10' />
//             <h1 className='font-bold text-2xl mt-4'>INICIAR SESION</h1>
//             <form onSubmit={handleSubmit} className="mx-auto  md:px-28 pb-20 rounded-lg">
//                 <div className="flex flex-col mt-4 w-full">
//                     <Input
//                         type="text"
//                         name='email'
//                         value={dataUser.password}
//                         onChange={handleChange}
//                         placeholder="Email"
//                     />
//                 </div>

//                 {/* {errors.password && (
//                     <div className="text-red-500 text-xs mt-2">{errors.password}</div>
//                 )} */}

//                 <div className="flex flex-col my-4">
//                     <Input
//                         type="password"
//                         name='password'
//                         value={dataUser.newPassword}
//                         onChange={handleChange}
//                         placeholder="Password"
//                     />
//                 </div>

//                 {/* {errors.newPassword && (
//                     <div className="text-red-500 text-xs mt-2">{errors.newPassword}</div>
//                 )} */}

// <div className="flex flex-col my-4">
//                     <Input
//                         type="password"
//                         name='password'
//                         value={dataUser.confirmPassword}
//                         onChange={handleChange}
//                         placeholder="Password"
//                     />
//                 </div>

//                 {/* {errors.confirmPassword && (
//                     <div className="text-red-500 text-xs mt-2">{errors.confirmPassword}</div>
//                 )} */}
                
//                 <Boton 
//                     type='submit'
//                     disabled={Object.keys(errors).length > 0}>
//                     Iniciar Sesion
//                 </Boton>
//             </form>
//         </div>
//     );
// };

// export default LoginForm;
