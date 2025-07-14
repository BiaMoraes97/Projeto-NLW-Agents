// Aqui pegamos as variáveis dos elementos
const apiKeyInput = document.getElementById('apiKey');
const gameSelect = document.getElementById('gameSelect');
const questionInput = document.getElementById('questionInput');
const askButton = document.getElementById('askButton');
const aiResponse = document.getElementById('aiResponse');
const form = document.getElementById('form');

const markdownToHTML = (text) => {
    const converter = new showdown.Converter();
    return converter.makeHtml(text);
}

const perguntarIA = async (question, game, apiKey) => {
    const model = "gemini-1.5-flash-latest"
    const geminiURL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const pergunta = `
        ## Especialidade
        Você é um especialista assistente de meta para o jogo ${game}

        ## Tarefa
        Você deve responder as perguntas do usuário com base no seu
        conhecimento do jogo, estratégias, build, dicas e informações

        ## Regras
        -Se você não sabe a resposta resposta, responda com "Não saberei te informa isso"
        e não tente inventar uma resposta. 
        -Se a pergunta não está relacionada ao jogo responda "Esta pergunta não está relacionada ao jogo". 
        -Considere a data atual ${new Date().toLocaleDateString()} 
        -Faça pesquisas atualizadas sobreo jogo, baseado na data atual,
        para dar uma resposta coerente.

        ## Resposta 
        -Economize na resposta, seja direto e responda no máximo 500 caracteres.
        -Responda em markdown.
        -Não precisa fazer nenhuma saudação ou despedida, apenas responda o que
        o usuário está querendo.

        ## Exemplo de resposta
        Pergunta do usuário: Qual um boss considerado diícil nesse jogo?
        Resposta: Um boss considerado difícil atualmente é:\n\n**Boss:**\n\n
        
        ---
        Aqui está a pergunta do usuário: ${question}
    `

    const contents = [{
        role: "user",
        parts: [{
            text: pergunta
        }]
    }]

    const tools = [{
        googleSearchRetrieval: {}
    }]

    // chamada API 
    const response = await fetch(geminiURL, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
            contents,
            tools
         })
    })

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`A resposta da API não foi bem-sucedida: ${response.status} - ${errorBody.error.message}`);
    }

    const data = await response.json()

    // Corrigido: A resposta pode vir em várias partes. É mais seguro iterar
    // sobre todas as partes e concatenar o texto.
    const responseParts = data.candidates[0].content.parts;
    let responseText = "";
    for (const part of responseParts) {
        responseText += part.text || "";
    }
    return responseText;
}

// Defini a função e proibi a página de recarregar
const enviarFormulario = async (event) => {
    event.preventDefault()
    // Aqui pegamos as informações
    const apiKey = apiKeyInput.value;
    const game = gameSelect.value;
    const question = questionInput.value;

    if (apiKey === '' || game === '' || question === '') {
        alert('Por favor, Preencha todos os campos');
        return
    }

    // Salva a chave no localStorage para não precisar digitar novamente
    localStorage.setItem('geminiApiKey', apiKey);

    askButton.disabled = true
    askButton.textContent = "Perguntando..."
    askButton.classList.add('loading')

    try {
    // Perguntar para a IA
    const responseText = await perguntarIA(question, game, apiKey);
    // Inserir o HTML diretamente no elemento de resposta.
    aiResponse.innerHTML = markdownToHTML(responseText); 
    aiResponse.classList.remove('hidden');

    } catch(error) {
        console.error('Erro: ', error);
        aiResponse.innerHTML = `<strong>Ocorreu um erro ao processar sua pergunta:</strong><p>${error.message}</p>`;
        aiResponse.classList.remove('hidden');
    } finally {
        askButton.disabled = false
        askButton.textContent = "Perguntar"
        askButton.classList.remove('loading')
    }
}

// Carrega a chave da API do localStorage quando a página é carregada
const loadApiKey = () => {
    const savedKey = localStorage.getItem('geminiApiKey');
    if (savedKey) {
        apiKeyInput.value = savedKey;
    }
}

form.addEventListener('submit', enviarFormulario);
document.addEventListener('DOMContentLoaded', loadApiKey);
