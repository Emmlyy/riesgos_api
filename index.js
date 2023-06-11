const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000; // Puerto en el que se ejecutará la API
const multer = require('multer');
// Configurar multer para manejar el archivo subido
const upload = multer({ dest: 'uploads/' });

// Configurar body-parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Rutas de ejemplo
app.get('/', (req, res) => {
  res.send('¡Hola, mundo!');
});
////////////////
// Función para parsear una línea específica según el formato deseado
function parseLine(line) {
  // Ejemplo de identificación y parseo de línea
  const [documento, nombre, apellido, tarjeta, tipo, telefono, poligono] = line.split(';');

  // Crear un objeto JSON con los datos identificados
  const jsonObject = {
    documento: documento.trim(),
    nombre: nombre.trim(),
    apellido: apellido.trim(),
    tarjeta: tarjeta.trim(),
    tipo:tipo.trim(),
    telefono:telefono.trim(),
    poligono: poligono.trim(),
  };

  return jsonObject;
}


//////////////////////////////////////////////////////////////////////////////////////
const fs = require('fs');

function convertTxtToXml(txtContent) {
  // Realizar aquí la lógica de conversión de TXT a JSON según tus requerimientos
  // En este ejemplo, se asume que cada línea del archivo TXT contiene un objeto JSON válido

const lines = txtContent.split('\n');
 
let xml=[] ;

  // Procesar cada línea
  lines.forEach((line) => {
  
    try {
      // Identificar y parsear la línea según el formato deseado
      const parsedObject = parseLine(line);

      const xmlContent = 
      `<clientes><cliente><documento>${parsedObject.documento}</documento><nombre>${parsedObject.nombre}</nombre><apellido>${parsedObject.apellido}</apellido><tarjeta>${parsedObject.tarjeta}</tarjeta><tipo>${parsedObject.tipo}</tipo><telefono>${parsedObject.telefono}</telefono><poligono>${parsedObject.poligono}</poligono></cliente></clientes>`;      
      // Agregar el objeto JSON al arreglo
      xml.push(xmlContent);
    } catch (error) {
      console.error(`Error parsing line: ${line}`);
    }

  });


  return xml;
}

// Ruta para subir el archivo TXT y convertirlo a XML
app.post('/convert_txt_to_xml', upload.single('file'), (req, res) => {
  // Aquí puedes realizar la lógica de conversión de TXT a XML
  // req.file contiene la información del archivo subido

  // Ejemplo de conversión sencilla a XML
  //const xml = `<root>${req.file.buffer.toString()}</root>`;

  // Leer el contenido del archivo TXT
  const txtContent = fs.readFileSync(req.file.path, 'utf-8');

  // Convertir el contenido del archivo TXT a XML
  const xml = convertTxtToXml(txtContent);


  res.set('Content-Type', 'application/xml');
  res.send(xml);
});
//////////////////////////////////////////////////////////////////////////////////////////

function convertTxtToJson(txtContent) {
  // Realizar aquí la lógica de conversión de TXT a JSON según tus requerimientos
  // En este ejemplo, se asume que cada línea del archivo TXT contiene un objeto JSON válido

const lines = txtContent.split('\n');
 /* const [obj] = txtContent.split(';;');
const lines = {
  obj: obj.trim()
}*/

  let json = [];

  
  // Procesar cada línea
  lines.forEach((line) => {
  
    try {
      // Identificar y parsear la línea según el formato deseado
      const parsedObject = parseLine(line);
      // Agregar el objeto JSON al arreglo
      json.push(parsedObject);
    } catch (error) {
      console.error(`Error parsing line: ${line}`);
    }

  });


  return json;
}

// Ruta para subir el archivo TXT y convertirlo a JSON
app.post('/convert_txt_to_json', upload.single('file'), (req, res) => {
  // Leer el contenido del archivo TXT
  const txtContent = fs.readFileSync(req.file.path, 'utf-8');

  // Convertir el contenido del archivo TXT a JSON
  const jsonContent = convertTxtToJson(txtContent);

  res.json(jsonContent);
});






///////////////////////////////////////////////////////////////////////
// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`La API está escuchando en el puerto ${PORT}`);
});


