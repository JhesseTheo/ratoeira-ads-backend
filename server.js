const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Dados em memória (substituir por banco de dados futuramente)
let configurations = [];

// Função para enviar notificações para o Telegram
function sendTelegramNotification(message) {
  const TELEGRAM_BOT_TOKEN = "SEU_BOT_TOKEN_AQUI"; // Substitua pelo token do bot
  const TELEGRAM_CHAT_ID = "SEU_CHAT_ID_AQUI";    // Substitua pelo ID do chat

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  return axios.post(url, {
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
  })
  .then(() => console.log("Notificação enviada para o Telegram"))
  .catch((error) => console.error("Erro ao enviar mensagem para o Telegram:", error.response?.data || error.message));
}

// Rota para listar todas as configurações
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

  // Envia notificação para o Telegram
  sendTelegramNotification(`Nova configuração criada: \n\n${JSON.stringify(newConfig, null, 2)}`);

  res.status(201).json(newConfig);
});

// Rota para excluir uma configuração
app.delete("/api/configurations/:id", (req, res) => {
  const configId = parseInt(req.params.id);
  const deletedConfig = configurations.find((config) => config.id === configId);

  if (!deletedConfig) {
    return res.status(404).json({ message: "Configuração não encontrada!" });
  }

  configurations = configurations.filter((config) => config.id !== configId);

  // Envia notificação para o Telegram
  sendTelegramNotification(`Configuração excluída: \n\n${JSON.stringify(deletedConfig, null, 2)}`);

  res.json({ message: "Configuração excluída com sucesso!" });
});

// Rota para gerar um script dinâmico
app.get("/api/generate-script/:id", (req, res) => {
  const config = configurations.find((c) => c.id === parseInt(req.params.id));
  if (!config) {
    return res.status(404).json({ message: "Configuração não encontrada!" });
  }

  const script = `<script>
    let visits = localStorage.getItem("${config.productName}-visits") || 0;
    visits++;
    localStorage.setItem("${config.productName}-visits", visits);

    if (visits > ${config.maxVisits}) {
      alert("Número máximo de visitas atingido!");
    } else {
      window.location.href = "${config.redirectURL}";
    }
  </script>`;

  res.type("text/plain").send(script);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
