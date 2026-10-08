const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());


const horariosSeminario = [
    "05:35", "06:10", "06:35", "06:50", "07:10",
    "07:30", "07:45", "08:05", "08:20", "09:00",
    "09:40", "10:20", "11:00", "11:35", "11:45",
    "12:10", "12:20", "12:40", "13:05", "13:15",
    "13:30", "13:50", "14:20", "14:50", "15:30",
    "16:00", "16:15", "16:30", "16:50", "17:15",
    "17:20", "17:35", "17:45", "18:00", "18:10",
    "18:25", "18:35", "18:45", "19:00", "19:30",
    "20:00", "20:40", "21:15", "21:45", "21:55",
    "22:10", "22:40", "23:00"
];

const horariosProgresso = [
    "04:50", "05:30", "05:55", "06:20", "06:45",
    "07:05", "07:20", "07:40", "08:00", "08:40",
    "09:20", "10:00", "10:40", "11:20", "11:40",
    "12:05", "12:35", "12:50", "13:20", "13:40",
    "14:20", "15:00", "15:40", "16:20", "17:00",
    "17:40", "18:05", "18:20", "18:50", "19:20",
    "20:10", "20:50", "21:30", "22:00", "22:40",
    "23:00", "23:40"
];


const TEMPO_SEMINARIO = "15-25";
const TEMPO_PROGRESSO = "8-15";


const horarios = [];

horariosSeminario.forEach((h, i) => {
    horarios.push({
        id: i + 1,
        linha: "Linha 08",
        origem: "Terminal Urbano",
        destino: "IFSC Seminário",
        horario: h,
        tempoEstimado: TEMPO_SEMINARIO
    });
});

horariosProgresso.forEach((h, i) => {
    horarios.push({
        id: 100 + i,
        linha: "Linha 26",
        origem: "Terminal Urbano",
        destino: "IFSC Progresso",
        horario: h,
        tempoEstimado: TEMPO_PROGRESSO
    });
});


const pontos = [
    {
        id: 1,
        nome: "Ponto Seminário 1",
        linha: "Linha 08",
        destino: "IFSC Seminário",
        tempoEstimado: TEMPO_SEMINARIO,
        lat: -27.137669,
        lng: -52.598281,
        imagem: "imgs/pontoseminario1.jpg"
    },
    {
        id: 2,
        nome: "Ponto Seminário 2",
        linha: "Linha 08",
        destino: "IFSC Seminário",
        tempoEstimado: TEMPO_SEMINARIO,
        lat: -27.135219,
        lng: -52.599637,
        imagem: "imgs/pontoseminario2.jpg"
    },
    {
        id: 3,
        nome: "Ponto Progresso 1",
        linha: "Linha 26",
        destino: "IFSC Progresso",
        tempoEstimado: TEMPO_PROGRESSO,
        lat: -27.137394,
        lng: -52.598123,
        imagem: "imgs/pontoprogresso1.jpg"
    },
    {
        id: 4,
        nome: "Ponto Progresso 2",
        linha: "Linha 26",
        destino: "IFSC Progresso",
        tempoEstimado: TEMPO_PROGRESSO,
        lat: -27.135219,
        lng: -52.599637,
        imagem: "imgs/pontoprogresso2.jpg"
    }
];


app.get("/api/horarios", (req, res) => {
    res.json(horarios);
});

app.get("/api/pontos", (req, res) => {
    res.json(pontos);
});


app.post("/api/calcular-saldo", (req, res) => {

    const { saldo, valorPassagem, viagensPorDia } = req.body;

    if (
        saldo === undefined ||
        valorPassagem === undefined ||
        viagensPorDia === undefined
    ) {
        return res.status(400).json({
            erro: "Informe saldo, valor da passagem e viagens por dia."
        });
    }

    if (saldo < 0 || valorPassagem <= 0 || viagensPorDia <= 0) {
        return res.status(400).json({
            erro: "Informe valores válidos."
        });
    }

    const viagensDisponiveisSemIntegracao =
        Math.floor(saldo / valorPassagem);

    const diasSemIntegracao =
        Math.floor(viagensDisponiveisSemIntegracao / viagensPorDia);

    const passagensCobradasPorDia =
        Math.ceil(viagensPorDia / 2);

    const custoDiarioComIntegracao =
        passagensCobradasPorDia * valorPassagem;

    const diasComIntegracao =
        Math.floor(saldo / custoDiarioComIntegracao);

    const custoDiarioSemIntegracao =
        viagensPorDia * valorPassagem;

    const economiaPorDia =
        custoDiarioSemIntegracao - custoDiarioComIntegracao;

    const economiaTotal =
        economiaPorDia * diasComIntegracao;

    const saldoRestante =
        saldo - (diasComIntegracao * custoDiarioComIntegracao);

    res.json({

        saldoAtual: saldo,
        valorPassagem: valorPassagem,
        viagensPorDia: viagensPorDia,

        viagensDisponiveisSemIntegracao: viagensDisponiveisSemIntegracao,
        diasSemIntegracao: diasSemIntegracao,

        passagensCobradasPorDia: passagensCobradasPorDia,
        custoDiarioComIntegracao: Number(custoDiarioComIntegracao.toFixed(2)),
        diasComIntegracao: diasComIntegracao,
        saldoRestante: Number(saldoRestante.toFixed(2)),

        economiaPorDia: Number(economiaPorDia.toFixed(2)),
        economiaTotal: Number(economiaTotal.toFixed(2))

    });

});


function normalizar(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}


function proximoHorario(lista) {

    const agora = new Date();
    const hh = String(agora.getHours()).padStart(2, "0");
    const mm = String(agora.getMinutes()).padStart(2, "0");
    const agoraStr = `${hh}:${mm}`;

    const futuros = lista
        .filter(h => h.horario > agoraStr)
        .sort((a, b) => a.horario.localeCompare(b.horario));

    if (futuros.length > 0) return futuros[0];
    return lista[0];
}


function detectarIntencao(msg) {

    if (/\b(oi|ola|opa|bom dia|boa tarde|boa noite|eai|e ai)\b/.test(msg))
        return "saudacao";

    if (/\b(ajuda|help|o que voce faz|comandos)\b/.test(msg))
        return "ajuda";

    if (/\b(saldo|cartao|credito|dinheiro|quanto tenho|integracao)\b/.test(msg))
        return "saldo";

    if (/\b(proximo|proxima|quando passa|quando vem|que horas passa)\b/.test(msg))
        return "proximo_onibus";

    if (/\b(tempo|quanto tempo|demora|duracao)\b/.test(msg))
        return "tempo";

    if (/\b(ponto|parada|onde pego|onde fica|endereco|local)\b/.test(msg))
        return "pontos";

    if (/\b(destino|para onde|vai para)\b/.test(msg))
        return "destino";

    if (/\b(horario|horarios|que horas|saida|saidas|onibus|linha)\b/.test(msg))
        return "horarios";

    return "fallback";
}


function detectarDestino(msg) {
    if (msg.includes("seminario")) return "IFSC Seminário";
    if (msg.includes("progresso")) return "IFSC Progresso";
    return null;
}


function responderIA(mensagem) {

    const msg = normalizar(mensagem);
    const intencao = detectarIntencao(msg);
    const destinoMencionado = detectarDestino(msg);

    let resposta = "";

    switch (intencao) {

        case "saudacao":
            resposta =
                "Olá. Sou o assistente do IFSC Mobilidade. " +
                "Posso ajudar com horários, pontos, tempo estimado, " +
                "saldo do cartão e regras de integração. O que você precisa?";
            break;

        case "ajuda":
            resposta =
                "Consigo responder perguntas como:\n" +
                "• Qual o próximo ônibus para o Seminário?\n" +
                "• Que horas sai o ônibus para o Progresso?\n" +
                "• Onde fica o ponto do Seminário?\n" +
                "• Quanto tempo leva até o Seminário?\n" +
                "• Como funciona a integração?";
            break;

        case "saldo":
            resposta =
                "Sobre o cartão: a passagem de estudante custa R$ 2,45. " +
                "O sistema de integração de Chapecó permite 1 integração " +
                "a cada 2 passagens pagas, desde que as viagens ocorram " +
                "em até 1 hora, em linhas não sobrepostas e sem retornar " +
                "ao ponto de origem. Use a Calculadora de saldo na aba " +
                "Cartão para ver quantos dias seu saldo dura com integração.";
            break;

        case "proximo_onibus": {

            let lista = horarios;

            if (destinoMencionado) {
                lista = horarios.filter(h => h.destino === destinoMencionado);
            }

            if (lista.length === 0) {
                resposta = "Não encontrei horários para esse destino.";
                break;
            }

            const p = proximoHorario(lista);

            resposta =
                `O próximo ônibus é a ${p.linha}, saindo às ${p.horario} ` +
                `com destino a ${p.destino}. ` +
                `Tempo estimado de viagem: ${p.tempoEstimado} minutos.`;
            break;
        }

        case "horarios": {

            let lista = horarios;

            if (destinoMencionado) {
                lista = horarios.filter(h => h.destino === destinoMencionado);
            }

            if (lista.length === 0) {
                resposta = "Não encontrei horários para esse destino.";
                break;
            }

            const proximos = lista
                .sort((a, b) => a.horario.localeCompare(b.horario))
                .slice(0, 6);

            resposta = `Próximos horários (${lista.length} no total):\n`;
            proximos.forEach(h => {
                resposta += `• ${h.horario} — ${h.linha} para ${h.destino}\n`;
            });
            break;
        }

        case "pontos": {

            let lista = pontos;

            if (destinoMencionado) {
                lista = pontos.filter(p => p.destino === destinoMencionado);
            }

            if (msg.includes("seminario")) {
                lista = pontos.filter(p => p.nome.toLowerCase().includes("seminario"));
            } else if (msg.includes("progresso")) {
                lista = pontos.filter(p => p.nome.toLowerCase().includes("progresso"));
            }

            if (lista.length === 0) {
                resposta = "Não encontrei pontos com esse critério.";
                break;
            }

            resposta = "Pontos de embarque:\n";
            lista.forEach(p => {
                resposta += `• ${p.nome} (${p.linha} para ${p.destino})\n`;
            });
            break;
        }

        case "tempo": {

            if (destinoMencionado === "IFSC Seminário") {
                resposta =
                    "O tempo estimado de viagem até o IFSC Seminário " +
                    "é de 15 a 25 minutos.";
                break;
            }

            if (destinoMencionado === "IFSC Progresso") {
                resposta =
                    "O tempo estimado de viagem até o IFSC Progresso " +
                    "é de 8 a 15 minutos.";
                break;
            }

            resposta =
                "Tempo estimado:\n" +
                "• IFSC Seminário: 15 a 25 minutos\n" +
                "• IFSC Progresso: 8 a 15 minutos";
            break;
        }

        case "destino": {

            const destinos = [...new Set(horarios.map(h => h.destino))];

            resposta =
                "Temos ônibus para:\n" +
                destinos.map(d => `• ${d}`).join("\n");
            break;
        }

        default:
            resposta =
                "Ainda não entendi essa pergunta. Tente algo como:\n" +
                "• Qual o próximo ônibus para o Seminário?\n" +
                "• Onde fica o ponto do Seminário?\n" +
                "• Quanto tempo até o Progresso?\n" +
                "• Como funciona a integração?";
    }

    return {
        pergunta: mensagem,
        intencao: intencao,
        resposta: resposta
    };
}


app.post("/api/ia", (req, res) => {

    const { mensagem } = req.body;

    if (!mensagem || typeof mensagem !== "string") {
        return res.status(400).json({
            erro: "Envie uma mensagem de texto."
        });
    }

    res.json(responderIA(mensagem));
});


app.listen(3000, () => {
    console.log("IFSC Mobilidade funcionando!");
    console.log("Servidor: http://localhost:3000");
});