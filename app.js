const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

app.use(express.json());

async function fetchData(url) {
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

async function getPlanetResidents() {
    const allPlanets = await getAllPlanets();

    // Ordenar planetas alfabéticamente
    allPlanets.sort((a, b) => a.name.localeCompare(b.name));

    let allResidents = [];

    for (let planet of allPlanets) {
        for (let endpoint of planet.residents) {
            const resident = await fetchData_Residents(endpoint);
            resident.homeworld = planet.name;
            allResidents.push(resident);
        }
    }

    return allResidents;
}

async function getAllCharacters() {
    const allCharacters = [];
    let nextUrl = 'https://swapi.py4e.com/api/people/';

    while (nextUrl) {
        const response = await fetchData(nextUrl);
        allCharacters.push(...response.results);
        nextUrl = response.next;
    }

    return allCharacters;
}

async function getAllCharactersOrdened(orderBy = 'name') {
    const allCharacters = await getAllCharacters();

    allCharacters.sort((a, b) => {
        let valueA = a[orderBy];
        let valueB = b[orderBy];

        if (orderBy === 'name') {
            return valueA.localeCompare(valueB);
        } else {
            if (valueA === 'unknown') {
                valueA = Infinity;
            } else {
                valueA = parseFloat(valueA);
            }
            if (valueB === 'unknown') {
                valueB = Infinity;
            } else {
                valueB = parseFloat(valueB);
            }
            return valueA - valueB;
        }
    });

    return allCharacters;
}

async function getAllPlanets() {
    const allPlanets = [];
    let nextUrl = 'https://swapi.py4e.com/api/planets/';

    while (nextUrl) {
        const response = await fetchData(nextUrl);
        allPlanets.push(...response.results);
        nextUrl = response.next;
    }

    return allPlanets;
}

app.get('/residentes', async (req, res) => {
    try {
        const allPlanets = await getAllPlanets();

        // Ordenar planetas alfabéticamente
        allPlanets.sort((a, b) => a.name.localeCompare(b.name));

        let allResidents = [];

        for (let planet of allPlanets) {
            for (let endpoint of planet.residents) {
                const resident = await fetchData(endpoint);
                resident.homeworld = planet.name;
                allResidents.push(resident);
            }
        }

        res.json(allResidents);
    } catch (error) {
        res.status(500).send('Error al obtener los residentes de los planetas');
    }
});

app.get('/personaje/:nombre', async (req, res) => {
    try {
        const nombre = req.params.nombre;
        const response = await axios.get(`https://swapi.py4e.com/api/people/?search=${nombre}`);
        const resultados = response.data.results;

        res.json(resultados);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/personajes', async (req, res) => {
    const { ordenar, page = 1 } = req.query;
    const limit = 10;

    try {
        let allCharacters = [];

        if (ordenar) {
            switch (ordenar) {
                case 'nombre':
                    allCharacters = await getAllCharactersOrdened('name');
                    break;
                case 'peso':
                    allCharacters = await getAllCharactersOrdened('mass');
                    break;
                case 'altura':
                    allCharacters = await getAllCharactersOrdened('height');
                    break;
                default:
                    return res.status(400).json({ error: 'Parámetro de ordenar no válido' });
            }
        } else {
            allCharacters = await getAllCharacters();
        }

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const results = allCharacters.slice(startIndex, endIndex);

        res.json({
            page,
            limit,
            total: allCharacters.length,
            results,
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los personajes' });
    }
});



app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
