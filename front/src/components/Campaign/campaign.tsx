'use client';

import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import ICampaign from '@/interfaces/ICampaign'; 
import Input from '../ui/Input';
import Boton from '../ui/Boton';
import { useAuth } from '@/context/Authontext';
import IGroup from '@/interfaces/IGroup';

const CampaignForm = () => {
  const { userData } = useAuth(); 
  const APIURL: string | undefined = process.env.NEXT_PUBLIC_API_URL;
  const [loading, setLoading] = useState(false); // Nuevo estado de carga
  const [groups, setGroups] = useState<IGroup[]>([]);
  const [formData, setFormData] = useState<ICampaign>({
    name: '',
    description: '',
    location: '',
    date: new Date(),
    userId: userData?.userData.id || '', 
    user: { 
      id: userData?.userData.id || '', 
      name: userData?.userData.name || '', 
      dni: 0, 
      email: '' 
    },
    candidates: [],
    groups: []  // Aquí mantenemos un array de grupos seleccionados
  });


  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch(`${APIURL}/groups/user/${userData?.userData.id}`);
        if (!response.ok) throw new Error("Error al obtener grupos");
        const data = await response.json();
        setGroups(data);
      } catch (error) {
        console.error("Error al cargar grupos:", error);
      }
    };

    fetchGroups();
  }, [userData]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prevData) => ({
      ...prevData,
      date: new Date(e.target.value),
    }));
  };

  const handleMultiSelectChange = (selectedOptions: any) => {
    const selectedGroups = selectedOptions.map((option: any) => ({ id: option.value, name: option.label }));
    setFormData(prevData => ({
      ...prevData,
      groups: selectedGroups,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // Iniciar el spinner

    const data = {
      ...formData,
      date: formData.date.toISOString(), // Asegúrate de que la fecha esté en formato ISO
    };

    try {
      const response = await fetch(`${APIURL}/campaigns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Error en la creación de la campaña");
      }

      window.location.href = "/campaigns";    
    } catch (error) {
      console.error("Error al crear la campaña:", error);
    } finally {
      setLoading(false); // Detener el spinner
    }
  };

  return (
    <>
      <div className="col-start-5 col-end-9 mt-[2.5em] my-[2em] text-center text-xl">
        CREAR CAMPAÑA
      </div>
      <form onSubmit={handleSubmit} className="campaign-form flex justify-center">
        <div className='flex flex-col items-center w-full md:w-[40%] gap-4'>
          <Input
            type="text"
            id="name"
            name="name"
            placeholder="Nombre de la campaña"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          <textarea
            id="description"
            name="description"
            placeholder="Descripción"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full h-40 px-5 py-3 text-base transition bg-transparent border rounded-md outline-none border-stroke dark:border-dark-3 text-body-color dark:text-dark-6 placeholder:text-black focus:border-primaryColor dark:focus:border-primaryColor focus-visible:shadow-none"
            required
          />
          <Input
            type="text"
            id="location"
            name="location"
            placeholder="Ubicación"
            value={formData.location}
            onChange={handleInputChange}
            required
          />
          <Input
            type="date"
            name="date"
            id="date"
            value={formData.date.toISOString().substring(0, 10)}
            onChange={handleDateChange}
            required
          />

          <Select
            isMulti
            name="groups"
            options={groups.map(group => ({ value: group.id, label: group.name }))}
            className="basic-multi-select w-full"
            classNamePrefix="select"
            onChange={handleMultiSelectChange}
            value={formData.groups.map(group => ({ value: group.id, label: group.name }))}
          />

          <Boton type="submit">Crear Campaña</Boton>
        </div>
      </form>
    </>
  );
};


export default CampaignForm;
