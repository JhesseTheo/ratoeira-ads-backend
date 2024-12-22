const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Dados em memória (substituíveis por um banco de dados futuramente)
let configurations = [];

// Rota para listar configurações
app.get("/api/configurations", (req, res) => {
  res.json(configurations);
});

// Rota para criar uma nova configuração
app.post("/api/configurations", (req, res) => {
  const { platform, productName, conversionAction, maxVisits, redirectURL } = req.body;
  if (!platform || !productName || !conversionAction) {
    return res.status(400).json({ message: "Campos obrigatórios ausentes!" });
  }

  const newConfig = {
    id: configurations.length + 1,
    platform,
    productName,
    conversionAction,
    maxVisits: maxVisits || 0,
    redirectURL: redirectURL || null,
    visits: 0,
  };

  configurations.push(newConfig);
  res.status(201).json(newConfig);
});

// Rota para excluir uma configuração
app.delete("/api/configurations/:id", (req, res) => {
  const configId = parseInt(req.params.id);
  configurations = configurations.filter((config) => config.id !== configId);
  res.json({ message: "Configuração excluída com sucesso!" });
});

// Rota para gerar um script dinâmico
app.get("/api/generate-script/:id", (req, res) => {
  const config = configurations.find((c) => c.id === parseInt(req.params.id));
  if (!config) {
    return res.status(404).json({ message: "Configuração não encontrada!" });
  }

  const script = `
    <script>
      let visits = localStorage.getItem("${config.productName}-visits") || 0;
      visits++;
      localStorage.setItem("${config.productName}-visits", visits);

      if (visits > ${config.maxVisits}) {
        alert("Número máximo de visitas atingido!");
      } else {
        window.location.href = "${config.redirectURL}";
      }
    </script>
  `;

  res.type("text/plain").send(script);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});