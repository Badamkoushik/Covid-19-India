const express = require('express')
const app = express()
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
app.use(express.json())
const dbPath = path.join(__dirname, 'covid19India.db')
let db = null

//IntialiseDBandServer

const intialiseDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error : ${e.message}`)
    process.exit(1)
  }
}
intialiseDBAndServer()

//GET

app.get('/states/', async (request, response) => {
  const getQuery = `
    SELECT 
    state_id as stateId,
    state_name as stateName,
    population
    FROM 
    state;`
  const dbStatus = await db.all(getQuery)
  response.send(dbStatus)
})

//GET --> By StateId

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
  SELECT 
  state_id as stateId,
  state_name as stateName,
  population as population
  FROM 
  state 
  WHERE state_id = ${stateId};`
  const dbStatus = await db.get(getStateQuery)
  response.send(dbStatus)
})

//POST

app.post('/districts/', async (request, response) => {
  const covidDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = covidDetails
  const postQuery = `
  INSERT
  INTO
  district
  (district_name,state_id,cases,cured,active,deaths)
  VALUES('${districtName}',${stateId},${cases},${cured},${active},${deaths});`
  await db.run(postQuery)
  response.send('District Successfully Added')
})

//GET -->DistrictId

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getQuery = `
  SELECT 
  district_id as districtId,
  district_name as districtName,
  state_id as stateId,
  cases,
  cured,
  active,
  deaths
  from 
  district
  where
  district_id = ${districtId};`
  const dbStatus = await db.get(getQuery)
  response.send(dbStatus)
})

//GET -->StateId

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getQuery = `
  SELECT 
  SUM(d.cases) as totalCases,
  SUM(d.cured) as totalCured,
  SUM(d.active) as totalActive,
  SUM(d.deaths) as totalDeaths
  FROM 
  state s 
  JOIN 
  district d
  on s.state_id = d.state_id
  WHERE s.state_id = ${stateId};`
  const getStatus = await db.get(getQuery)
  response.send(getStatus)
})

//GET --> DistrictId

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getQuery = `
  SELECT
  s.state_name as stateName 
  FROM
  state s 
  JOIN
  district d
  ON
  s.state_id = d.state_id
  WHERE d.district_id = ${districtId};`
  const dbStatus = await db.get(getQuery)
  response.send(dbStatus)
})

//PUT

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const covidDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = covidDetails
  const updateQuery = `
  UPDATE
  district
  SET
  district_name = '${districtName}' , 
  state_id = ${stateId} , 
  cases = ${cases} , 
  cured = ${cured} , 
  active = ${active} , 
  deaths = ${deaths}
  WHERE
  district_id = ${districtId};`
  await db.run(updateQuery)
  response.send('District Details Updated')
})

//Delete

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteQuery = `
  DELETE 
  FROM
  district
  WHERE district_id = ${districtId};`
  await db.run(deleteQuery)
  response.send('District Removed')
})

module.exports = app