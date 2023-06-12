const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const xmlbuilder = require('xmlbuilder');
const xml2js = require('xml2js');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;

const privateKey = fs.readFileSync('keys/private.pem', 'utf-8');

// Configurar multer para manejar el archivo subido
const upload = multer({ dest: "uploads/" });

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
    tarjeta: encryptCardNumber(tarjeta.trim()),
    tipo: tipo.trim(),
    telefono: telefono.trim(),
    poligono: poligono.trim(),
  };

  return jsonObject;
}

// Función para encriptar el número de tarjeta
const encryptCardNumber = (cardNumber) => jwt.sign(cardNumber, privateKey, { algorithm: 'RS256' });

// Función para desencriptar el número de tarjeta
const decryptCardNumber = (encryptedCardNumber, publicKey) => jwt.verify(encryptedCardNumber, publicKey);

//////////////////////////////////////////////////////////////////////////////////////
/////////////TXT TO XML//////////////////
/////////////////////////////////////////////////////////////////////////

function convertTxtToXml(txtContent, delimiter, key) {
  const lines = txtContent.split("\n");

  const xml = xmlbuilder.create('clientes');

  lines.forEach((line) => {
    try {
      const parsedObject = parseLine(line, delimiter);
      const cliente = xml.ele('cliente');
      cliente.ele('documento', parsedObject.documento);
      cliente.ele('nombre', parsedObject.nombre);
      cliente.ele('tarjeta', encryptCardNumber(parsedObject.tarjeta));
      cliente.ele('tipo', parsedObject.tipo);
      cliente.ele('telefono', parsedObject.telefono);
      cliente.ele('poligono', parsedObject.poligono);
    } catch (error) {
      console.error(`Error parsing line: ${line}`);
    }
  });

  const xmlString = xml.end({ pretty: true });
  return xmlString;
}

// Ruta para subir el archivo TXT y convertirlo a XML
app.post("/convert_txt_to_xml/:delimiter/:key", upload.single("file"), (req, res) => {
  const { delimiter, key } = req.params;
  const txtContent = fs.readFileSync(req.file.path, "utf-8");
  const xml = convertTxtToXml(txtContent, delimiter, key);
  res.set("Content-Type", "application/xml");
  res.send(xml);
});

//////////////////////////////////////////////////////////////////////////////////////////
////////////TXT TO JSON/////////////////////
//////////////////////////////////////////////////////////////////////////

function convertTxtToJson(txtContent, delimiter, key) {
  const lines = txtContent.split("\n");
  let json = [];

  lines.forEach((line) => {
    try {
      const parsedObject = parseLine(line, delimiter);
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
  const txtContent = fs.readFileSync(req.file.path, "utf-8");
  const jsonContent = convertTxtToJson(txtContent, delimiter, key);
  res.json(jsonContent);
});

///////////////////////////////////////////////////////////////////////
///////////////// XML TO TXT///////////////////
////////////////////////////////////////////////////////////////////

function convertXMLtoTXT(xmlContent, delimiter, key, publicKey) {
  let txtContent = '';

  xml2js.parseString(xmlContent, (err, result) => {
    if (err) {
      throw new Error('Error al analizar el XML');
    }

    const clientes = result.clientes.cliente;

    clientes.forEach(cliente => {
      const attributes = Object.keys(cliente);
      const values = attributes.map((attribute) => {
        if (attribute === 'tarjeta' && publicKey) {
          return decryptCardNumber(cliente[attribute][0], publicKey);
        }
        return cliente[attribute][0];
      });

      const line = values.join(delimiter);
      txtContent += line + '\n';
    });
  });

  return txtContent;
}

// Ruta para subir el archivo XML y convertirlo a TXT
app.post('/convert_xml_to_txt/:delimiter/:key', upload.single('file'), (req, res) => {
  const { delimiter, key } = req.params;
  const xmlContent = fs.readFileSync(req.file.path, 'utf-8');
  const txtContent = convertXMLtoTXT(xmlContent, delimiter, key, req.body.publicKey);
  res.set('Content-Type', 'text/plain');
  res.send(txtContent);
});

///////////////////////////////////////////////////////////////////////
/////////////////  JSON TO TXT ////////////////
//////////////////////////////////////////////////////////////////////

function convertJsonToTxt(jsonArray, delimiter, key, publicKey) {
  const txt = jsonArray.map(obj => {
    if (publicKey) {
      obj.tarjeta = decryptCardNumber(obj.tarjeta, publicKey);
    }
    return Object.values(obj).join(delimiter);
  }).join('\n');
  return txt;
}

// Ruta para recibir un objeto JSON y convertirlo a TXT
app.post('/convert_json_to_txt/:delimiter/:key', upload.single('file'), (req, res) => {
  const { delimiter, key } = req.params;
  const jsonContent = fs.readFileSync(req.file.path, 'utf-8');
  const jsonArray = JSON.parse(jsonContent, delimiter);
  const txtContent = convertJsonToTxt(jsonArray, delimiter, key, req.body.publicKey);
  res.set('Content-Type', 'text/plain');
  res.send(txtContent);
});

/////////////////////////////////////////
// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`La API está escuchando en el puerto ${PORT}`);
});
