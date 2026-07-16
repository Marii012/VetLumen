import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import api from "../../services/api";
import "./Pets.css";
import "./Profile.css";

const sexOptions = [
  { value: "F", label: "Feminino" },
  { value: "M", label: "Masculino" }
];

const stateOptions = [
  { value: "Ativo", label: "Ativo" },
  { value: "Inativo", label: "Inativo" }
];

const EditPetPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    nome: "",
    sexo: "",
    data_nascimento: "",
    peso: "",
    cor: "",
    estado: "Ativo",
    observacoes: "",
    fotografia: "",
  });

  const [speciesOptions, setSpeciesOptions] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState(null);

  const [breedOptions, setBreedOptions] = useState([]);
  const [selectedBreed, setSelectedBreed] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");



  const fetchBreedsBySpecies = async (speciesId) => {
    if (!speciesId) {
      setBreedOptions([]);
      return [];
    }

    try {
      const response = await api.get(`/breeds/species/${speciesId}`);

      const options = (response.data || []).map((breed) => ({
        value: breed.id_breed,
        label: breed.nome_raca,
      }));

      setBreedOptions(options);

      return options;

    } catch (error) {
      setBreedOptions([]);
      return [];
    }
  };



  useEffect(() => {

    const loadData = async () => {

      try {

        setLoading(true);

        const [
          speciesResponse,
          petResponse
        ] = await Promise.all([
          api.get("/species"),
          api.get(`/pets/${id}`)
        ]);


        const species = (speciesResponse.data || []).map((item) => ({
          value: item.id_species,
          label: item.nome_especie,
        }));


        const pet = petResponse.data;


        setSpeciesOptions(species);


        const currentSpecies = species.find(
          (item) =>
            Number(item.value) === Number(pet.id_species)
        ) || null;


        setSelectedSpecies(currentSpecies);



        let breeds = [];

        if (currentSpecies?.value) {
          breeds = await fetchBreedsBySpecies(currentSpecies.value);
        }



        const currentBreed = breeds.find(
          (item) =>
            Number(item.value) === Number(pet.id_breed)
        ) || null;


        setSelectedBreed(currentBreed);



        setFormData({
          nome: pet.nome || "",
          sexo: pet.sexo || "",
          data_nascimento: pet.data_nascimento
            ? new Date(pet.data_nascimento)
                .toISOString()
                .split("T")[0]
            : "",
          peso: pet.peso ?? "",
          cor: pet.cor || "",
          estado: pet.estado || "Ativo",
          observacoes: pet.observacoes || "",
          fotografia: pet.fotografia || "",
        });



      } catch (error) {

        console.error(error);

        setError(
          error.response?.data?.message ||
          "Não foi possível carregar o animal."
        );

      } finally {

        setLoading(false);

      }

    };


    loadData();

  }, [id]);




  const handleSpeciesChange = async (option) => {

    setSelectedSpecies(option);
    setSelectedBreed(null);


    if (!option?.value) {
      setBreedOptions([]);
      return;
    }


    await fetchBreedsBySpecies(option.value);

  };




  const handleChange = (event) => {

    const {
      name,
      value
    } = event.target;


    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));

  };




  const handleSubmit = async (event) => {

    event.preventDefault();

    setSaving(true);
    setError("");


    try {


      await api.put(`/pets/${id}`, {

        nome: formData.nome.trim(),

        id_species:
          Number(selectedSpecies.value),

        id_breed:
          selectedBreed?.value
            ? Number(selectedBreed.value)
            : null,

        sexo:
          formData.sexo || null,

        data_nascimento:
          formData.data_nascimento || null,

        peso:
          formData.peso
            ? Number(formData.peso)
            : null,

        cor:
          formData.cor || null,

        estado:
          formData.estado || "Ativo",

        observacoes:
          formData.observacoes || null,

        fotografia:
          formData.fotografia || null,

      });



      navigate("/client/pets");


    } catch (error) {

      console.error(
        "Erro ao atualizar animal:",
        error
      );


      setError(
        error.response?.data?.message ||
        "Não foi possível guardar as alterações."
      );


    } finally {

      setSaving(false);

    }

  };




  return (

    <main className="appointments-container">


      <div className="appointments-header">

        <div>

          <h1>
            Editar Animal
          </h1>

          <p>
            Atualize os dados do animal selecionado.
          </p>

        </div>



        <button
          type="button"
          className="dashboard-btn"
          onClick={() => navigate("/client/pets")}
        >

          <i className="bi bi-arrow-left"></i>

          Voltar

        </button>


      </div>




      {loading ? (

        <div className="profile-card">

          <p>
            A carregar dados do animal...
          </p>

        </div>


      ) : (



        <form
          className="add-pet-form"
          onSubmit={handleSubmit}
        >


          {
            error &&
            <p className="profile-error full-width">
              {error}
            </p>
          }




          <div className="profile-item add-pet-name-field">

            <label>
              Nome
            </label>

            <input
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className="profile-input"
              required
            />

          </div>





          <div className="profile-item add-pet-species-field">

            <label>
              Espécie
            </label>


            <Select

              className="pet-form-select"
              classNamePrefix="pet-form-select"

              options={speciesOptions}

              value={selectedSpecies}

              onChange={handleSpeciesChange}

              isSearchable={false}

              placeholder="Selecione a espécie"

            />


          </div>





          <div className="profile-item add-pet-breed-field">


            <label>
              Raça
            </label>


            <Select

              className="pet-form-select"
              classNamePrefix="pet-form-select"

              options={breedOptions}

              value={selectedBreed}

              onChange={setSelectedBreed}

              isSearchable={false}

              placeholder="Selecione a raça"

              isDisabled={!selectedSpecies}

            />


          </div>





          <div className="profile-item add-pet-sex-field">

            <label>
              Sexo
            </label>


            <Select

              className="pet-form-select"

              classNamePrefix="pet-form-select"

              options={sexOptions}

              value={
                sexOptions.find(
                  item =>
                    item.value === formData.sexo
                ) || null
              }


              onChange={(option) =>
                setFormData(previous => ({
                  ...previous,
                  sexo: option?.value || ""
                }))
              }


              isSearchable={false}

              placeholder="Selecione o sexo"

            />


          </div>





          <div className="add-pet-inline-row add-pet-metrics-row">


            <div className="profile-item">

              <label>
                Data de nascimento
              </label>


              <input

                type="date"

                name="data_nascimento"

                value={formData.data_nascimento}

                onChange={handleChange}

                className="profile-input"

              />


            </div>




            <div className="profile-item">

              <label>
                Peso (kg)
              </label>


              <input

                type="number"

                step="0.1"

                name="peso"

                value={formData.peso}

                onChange={handleChange}

                className="profile-input"

              />


            </div>


          </div>





          <div className="add-pet-inline-row add-pet-status-row">


            <div className="profile-item">


              <label>
                Cor
              </label>


              <input

                name="cor"

                value={formData.cor}

                onChange={handleChange}

                className="profile-input"

              />


            </div>





            <div className="profile-item">


              <label>
                Estado
              </label>


              <Select

                className="pet-form-select"

                classNamePrefix="pet-form-select"

                options={stateOptions}

                value={
                  stateOptions.find(
                    item =>
                      item.value === formData.estado
                  )
                }


                onChange={(option) =>
                  setFormData(previous => ({
                    ...previous,
                    estado: option?.value || "Ativo"
                  }))
                }


                isSearchable={false}

              />


            </div>


          </div>





          <div className="profile-item full-width">

            <label>
              Observações
            </label>


            <textarea

              name="observacoes"

              value={formData.observacoes}

              onChange={handleChange}

              className="profile-input"

              rows="4"

            />


          </div>





          <div className="profile-item full-width">


            <label>
              URL da fotografia
            </label>


            <input

              name="fotografia"

              value={formData.fotografia}

              onChange={handleChange}

              className="profile-input"

              placeholder="https://"

            />


          </div>





          <div className="profile-edit-actions full-width">


            <button

              type="button"

              className="password-btn"

              onClick={() => navigate("/client/pets")}

              disabled={saving}

            >

              Cancelar

            </button>




            <button

              type="submit"

              className="edit-profile-btn"

              disabled={saving}

            >

              {
                saving
                  ? "A guardar..."
                  : "Guardar Alterações"
              }


            </button>


          </div>




        </form>


      )}


    </main>

  );

};


export default EditPetPage;