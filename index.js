const express = require("express")
const cors = require("cors")

const app = express()
app.use(express.json())
app.use(cors())

app.post("/webhook", (req, res) => {

  console.log("Mensagem recebida")

  const data = req.body

  if (data?.data?.key?.remoteJid) {
    console.log("Número:", data.data.key.remoteJid)
  }

  if (data?.data?.message?.conversation) {
    console.log("Mensagem:", data.data.message.conversation)
  }

  res.status(200).json({
    status: "received"
  })
})

app.listen(3000, () => {
  console.log("Servidor rodando")
})