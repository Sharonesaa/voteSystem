'use client';
import { useEffect, useState } from "react";
import Boton from "../ui/Boton";
import Input from "../ui/Input";
import InputFile from "../ui/InputFile";
import Textarea from "../ui/Textarea";
import Select from "../ui/Select";
import { useAuth } from '@/context/Authontext';
import Spinner from "../ui/Spinner"; // Importa el componente Spinner
import { useRouter } from "next/router";
import { stringify } from "querystring";



const APIURL: string | undefined = process.env.NEXT_PUBLIC_API_URL;


const CreateCandidate : React.FC<{ id: string }> = ({ id }) => {

 
  const userId =id
  const [postulation, setPostulation] = useState<string>("");
  const [list, setList] = useState<string>("");
  const [campaignDescription, setCampaignDescription] = useState<string>("");
  const [proposals, setProposals] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false); // Estado para controlar el spinner

  useEffect(() => {
    const fetchCampaigns = async () => {
      const localUser = localStorage.getItem("userSession");
      const localUserParsed = JSON.parse(localUser!);
      const actualUserId = localUserParsed.userData.id
      
      try {
        const response = await fetch(`${APIURL}/campaigns/user/${actualUserId}`);
        if (!response.ok) throw new Error("Error al obtener campañas");
        const data = await response.json();
        setCampaigns(data); // Asegúrate de que el formato de data sea el correcto
      } catch (error) {
        console.error("Error al cargar campañas:", error);
      }
    };

    fetchCampaigns();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleProposalsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setProposals(value.split("\n"));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); // Muestra el spinner

    const formData = new FormData();
    formData.append("postulation", postulation);
    formData.append("list", list);
    formData.append("campaignDescription", campaignDescription);
    formData.append("proposals", JSON.stringify(proposals));
    formData.append("userId", userId!); // Usar el userId del contexto
    formData.append("campaignId", selectedCampaignId); // Usar el campaignId seleccionado
    if (file) {
      formData.append("file", file);
    }

    try {
      const response = await fetch(`${APIURL}/candidates`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Error en la creación del candidato");
      }
      window.location.href = "/candidates";
    } catch (error) {
      console.error("Error al crear candidato:", error);
    } finally {
      setLoading(false); // Oculta el spinner cuando termina la solicitud
    }
  };

  return (
    <div className="flex flex-col justify-center items-center p-6 bg-white shadow-lg rounded-lg w-full max-w-4xl mx-auto sm:w-11/12 md:w-9/12 lg:w-3/4 xl:w-2/3">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-opacity-75 bg-gray-500">
          <Spinner /> {/* Muestra el spinner mientras se está cargando */}
        </div>
      )}
      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <h1 className="text-lg font-bold text-center">Crear Candidato</h1>
        <Input
          type="text"
          placeholder="Postulación"
          value={postulation}
          onChange={(e) => setPostulation(e.target.value)}
          required
        />
        <Input
          type="text"
          placeholder="Lista"
          value={list}
          onChange={(e) => setList(e.target.value)}
          required
        />
        <Textarea
          value={campaignDescription}
          placeholder="Descripción de la campaña"
          onChange={(e) => setCampaignDescription(e.target.value)}
          required
        />
        <div className="rounded-md">
          <label className="block text-sm font-medium text-gray-700">Propuestas</label>
          <Textarea
            value={proposals.join("\n")}
            onChange={handleProposalsChange}
            placeholder="Escribe cada propuesta en una nueva línea"
          />
        </div>
        <div className="rounded-md">
          <label className="block text-sm font-medium text-gray-700">Campaña</label>
          <Select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            required
          >
            <option value="">Seleccione una campaña</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="rounded-md">
          <label className="block text-sm font-medium text-gray-700">Imagen del candidato (JPG)</label>
          <InputFile
            type="file"
            accept="image/jpeg"
            onChange={handleFileChange}
          />
        </div>
        <div className="flex justify-center">
          <div className="w-[50%] sm:w-[40%] md:w-[30%] lg:w-[25%] xl:w-[20%]">
            <Boton>Crear Candidato</Boton>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateCandidate;
