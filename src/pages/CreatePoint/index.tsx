import axios from 'axios';
import React, { ChangeEvent, useEffect, useState, FormEvent } from 'react';
import { FiArrowLeft } from "react-icons/fi";
import { Map, Marker, TileLayer } from "react-leaflet";
import { Link, useHistory } from 'react-router-dom';
import logo from "./../../assets/logo.svg";
import Item from "./../../core/models/item.interface";
import api from "./../../services/api";
import './styles.css';
import { LeafletMouseEvent } from 'leaflet';

export interface CreatePointProps {
}

export interface IBGEUfResponse {
    sigla: string
}

export interface IBGECityResponse {
    nome: string
}

const CreatePoint: React.SFC<CreatePointProps> = () => {
    const [items, setItens] = useState<Item[]>([]);
    const [ufs, setUfs] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        whatsapp: ""
    });

    const history = useHistory();

    const [selectedUf, setSelectedUf] = useState<string>("0");
    const [selectedCity, setSelectedCity] = useState<string>("0");
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);
    const [intialPosition, setIntialPosition] = useState<[number, number]>([0, 0]);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);

    useEffect(() => {
        api.get('/items').then(
            response => {
                setItens(response.data)
            });
    }, [])

    useEffect(() => {
        axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`).then(
            response => {
                const citiesName = response.data.map(city => city.nome)
                setCities(citiesName)
            })
    }, [selectedUf])

    useEffect(() => {
        axios.get<IBGEUfResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(
            response => {
                const UfIntials = response.data.map(uf => uf.sigla)
                setUfs(UfIntials)
            })
    }, [])

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            setIntialPosition([latitude, longitude])
        })
    }, [])

    function handleSelectUf(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedUf(event.target.value)
    }
    function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedCity(event.target.value)
    }
    function handleMapClick(event: LeafletMouseEvent) {
        setSelectedPosition([event.latlng.lat, event.latlng.lng]);
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;
        setFormData({
            ...formData,
            [name]: value
        })
    }

    function handleSelectItem(id: number) {
        if (selectedItems.includes(id)) {
            setSelectedItems(selectedItems.filter(item => item !== id))
        } else {
            setSelectedItems([...selectedItems, id]);
        }
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault()
        const { name, email, whatsapp } = formData;
        const uf = selectedUf;
        const city = selectedCity;
        const [latitude, longitute] = selectedPosition;
        const items = selectedItems;
        const dataSend = {
            name,
            email,
            whatsapp,
            uf,
            city,
            lat: latitude,
            long: longitute,
            items
        };

        const response = await api.post('points', dataSend);
        alert("Ponto de coleta criado com sucesso!")
        history.push("/")
        

    }

    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta" />
                <Link to="/">
                    <FiArrowLeft />
                Voltar para home
            </Link>
            </header>
            <form onSubmit={handleSubmit}>
                <h1>Cadastro do ponto de coleta</h1>
                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="name">Nome</label>
                        <input onChange={handleInputChange} type="text" name="name" id="name" />
                    </div>
                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">Email</label>
                            <input onChange={handleInputChange} type="email" name="email" id="email" />
                        </div>
                        <div className="field">
                            <label htmlFor="whatsapp">Whatsapp</label>
                            <input onChange={handleInputChange} type="text" name="whatsapp" id="whatsapp" />
                        </div>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>
                    <Map center={intialPosition} zoom={15} onClick={handleMapClick}>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <Marker position={selectedPosition}>

                        </Marker>

                    </Map>
                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado</label>
                            <select onChange={handleSelectUf} value={selectedUf} name="uf" id="uf">
                                <option value="0">Selecione um estado</option>
                                {ufs.map((uf) => (
                                    <option key={uf} value={uf}>{uf}</option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select onChange={handleSelectCity} value={selectedCity} name="city" id="city">
                                <option value="0">Selecione uma cidade</option>
                                {cities.map((city) => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>
                        <h2>Ítens de coleta</h2>
                        <span>Selecione um ou mais ítens abaixo</span>
                    </legend>
                    <ul className="items-grid">
                        {items.map(
                            item => (
                                <li className={selectedItems.includes(item.id) ? 'selected' : ''} key={item.id} onClick={() => handleSelectItem(item.id)}>
                                    <img src={item.image_url} alt="" />
                                    <span>{item.title}</span>
                                </li>
                            )
                        )}
                    </ul>
                </fieldset>

                <button type="submit">Cadastrar ponto de coleta</button>
            </form>
        </div>
    );
}

export default CreatePoint;