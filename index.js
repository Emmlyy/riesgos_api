const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = 3000; // Puerto en el que se ejecutará la API
const multer = require("multer");
// Configurar multer para manejar el archivo subido
const upload = multer({ dest: "uploads/" });
const xmlbuilder = require('xmlbuilder');
const xml2js = require('xml2js');



// Configurar body-parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

// Rutas de ejemplo
app.get("/", (req, res) => {
  res.send("¡Hola, mundo!");
});
////////////////

const fs = require('fs');
const { Console } = require('console');
const { delimiter } = require("path");


//////////////////////////////////////////////////////////////////////////////////
// Función para parsear una línea específica según el formato deseado
function parseLine(line, delimiter) {
  // Ejemplo de identificación y parseo de línea
  const [documento, nombre, apellido, tarjeta, tipo, telefono, poligono] =
    line.split(delimiter);

  // Crear un objeto JSON con los datos identificados
  const jsonObject = {
    documento: documento.trim(),
    nombre: nombre.trim(),
    apellido: apellido.trim(),
    tarjeta: tarjeta.trim(),
    tipo: tipo.trim(),
    telefono: telefono.trim(),
    poligono: poligono.trim(),
  };

  return jsonObject;
}


//////////////////////////////////////////////////////////////////////////////////////
/////////////TXT TO XML//////////////////
/////////////////////////////////////////////////////////////////////////


function convertTxtToXml(txtContent, delimiter, key) {
  // Realizar aquí la lógica de conversión de TXT a JSON según tus requerimientos
  // En este ejemplo, se asume que cada línea del archivo TXT contiene un objeto JSON válido

  const lines = txtContent.split("\n");

  const xml = xmlbuilder.create('clientes');


  // Procesar cada línea
  lines.forEach((line) => {
  
    try {
      // Identificar y parsear la línea según el formato deseado
      const parsedObject = parseLine(line,delimiter);
      const cliente = xml.ele('cliente');
      cliente.ele('documento',parsedObject.documento);
      cliente.ele('nombre',parsedObject.nombre);
      cliente.ele('tarjeta',parsedObject.tarjeta);
      cliente.ele('tipo',parsedObject.tipo);
      cliente.ele('telefono',parsedObject.telefono);
      cliente.ele('poligono',parsedObject.poligono);

    // Obtener el XML como una cadena
    } catch (error) {
      console.error(`Error parsing line: ${line}`);
    }

  });
 const xmlString = xml.end({ pretty: true });


  return xmlString;
}
// Ruta para subir el archivo TXT y convertirlo a XML
app.post("/convert_txt_to_xml/:delimiter/:key", upload.single("file"), (req, res) => {
  // Aquí puedes realizar la lógica de conversión de TXT a XML
  // req.file contiene la información del archivo subido
  const { delimiter, key } = req.params;

  // Leer el contenido del archivo TXT
  const txtContent = fs.readFileSync(req.file.path, "utf-8");

  // Convertir el contenido del archivo TXT a XML
  const xml = convertTxtToXml(txtContent, delimiter, key);

  res.set("Content-Type", "application/xml");
  res.send(xml);
});
//////////////////////////////////////////////////////////////////////////////////////////
////////////TXT TO JSON/////////////////////
//////////////////////////////////////////////////////////////////////////


function convertTxtToJson(txtContent, delimiter, key) {
  // Realizar aquí la lógica de conversión de TXT a JSON según tus requerimientos
  // En este ejemplo, se asume que cada línea del archivo TXT contiene un objeto JSON válido

  const lines = txtContent.split("\n");

  let json = [];

  // Procesar cada línea
  lines.forEach((line) => {
    try {
      // Identificar y parsear la línea según el formato deseado
      const parsedObject = parseLine(line, delimiter);
      // Agregar el objeto JSON al arreglo
      json.push(parsedObject);
    } catch (error) {
      console.error(`Error parsing line: ${line}`);
    }
  });

  return json;
}

// Ruta para subir el archivo TXT y convertirlo a JSON
app.post("/convert_txt_to_json/:delimiter/:key", upload.single("file"), (req, res) => {

  const { delimiter, key } = req.params;
  // Leer el contenido del archivo TXT
  const txtContent = fs.readFileSync(req.file.path, "utf-8");

  // Convertir el contenido del archivo TXT a JSON
  const jsonContent = convertTxtToJson(txtContent,delimiter, key);

  res.json(jsonContent);
});

///////////////////////////////////////////////////////////////////////
///////////////// XML TO TXT///////////////////
////////////////////////////////////////////////////////////////////

function convertXMLtoTXT(xmlContent, delimiter, key) {
  let txtContent = '';

  xml2js.parseString(xmlContent, (err, result) => {
    if (err) {
      throw new Error('Error al analizar el XML');
    }

    const clientes = result.clientes.cliente;
    clientes.forEach(cliente => {
      const attributes = Object.keys(cliente);
      const values = attributes.map(attribute => cliente[attribute][0]);
      const line = values.join(delimiter);

      txtContent += line + '\n';
    });
  });

  return txtContent;
}



//Ruta para subir el archivo XML y convertirlo a TXT
// Ruta para subir el archivo XML y convertirlo a TXT
app.post('/convert_xml_to_txt/:delimiter/:key', upload.single('file'), (req, res) => {

  const { delimiter, key } = req.params;

  // Leer el contenido del archivo XML
  const xmlContent = fs.readFileSync(req.file.path, 'utf-8');

  // Convertir el contenido del archivo XML a TXT
  const txtContent = convertXMLtoTXT(xmlContent, delimiter, key);

  res.set('Content-Type', 'text/plain');
  res.send(txtContent);
});
///////////////////////////////////////////////////////////////////////
/////////////////  JSON TO TXT ////////////////
//////////////////////////////////////////////////////////////////////

function convertJsonToTxt(jsonArray, delimiter, key) {

  const txt = jsonArray.map(obj => Object.values(obj).join(delimiter)).join('\n');
  
    return txt;
  }
  
  // Ruta para recibir un objeto JSON y convertirlo a TXT
  app.post('/convert_json_to_txt/:delimiter/:key', upload.single('file'), (req, res) => {

    const { delimiter, key } = req.params;

    
    const jsonContent= fs.readFileSync(req.file.path, 'utf-8');
    //const jsonArray = JSON.parse(jsonContent, delimiter);
    // Convertir el array JSON a TXT
    const txtContent = convertJsonToTxt(jsonArray, delimiter, key);  
    
  /*try{
    const jsonArray = JSON.parse(jsonContent);
  
    if (Array.isArray(jsonArray)) {
      // Aquí puedes realizar las operaciones con el jsonArray válido
      
      // Convertir el array JSON a TXT
       txtContent = convertJsonToTxt(jsonArray);  
    } else {
      console.log('El archivo JSON no contiene un array válido.');
    }
  } catch (error) {
    console.error('Error al analizar el contenido JSON:', error);
  }*/
  
  
    res.set('Content-Type', 'text/plain');
    res.send(txtContent);
  });

/////////////////////////////////////////
// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`La API está escuchando en el puerto ${PORT}`);
});
