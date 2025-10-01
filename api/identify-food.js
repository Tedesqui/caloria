import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(request, response) {
    try {
        if (request.method !== 'POST') {
            return response.status(405).json({ error: 'Method Not Allowed' });
        }
        if (!request.body) {
             return response.status(400).json({ error: 'Corpo da requisição ausente.' });
        }
        const { image } = request.body;
        if (!image) {
            return response.status(400).json({ error: 'A imagem é obrigatória.' });
        }

        // --- PROMPT MODIFICADO PARA ANÁLISE DE MÚLTIPLOS ALIMENTOS ---
        const prompt = `
        Analise a imagem de um prato de comida. Sua tarefa é identificar TODOS os alimentos relevantes na imagem.

        Para cada alimento identificado, forneça:
        1. O nome do alimento (ex: "Arroz branco", "Feijão", "Bife grelhado").
        2. Uma estimativa do peso em gramas (ex: 150, 100, 120).
        3. O valor calórico estimado para essa quantidade.

        Formate sua resposta final estritamente como um único objeto JSON. Este objeto deve conter:
        - Uma chave "itens", que é um ARRAY de objetos. Cada objeto dentro do array representa um alimento e deve ter as chaves "alimento", "quantidade" e "calorias".
        - Uma chave "total_calorias", que é a SOMA de todas as calorias dos itens identificados.

        Exemplo de formato de resposta:
        {
          "itens": [
            { "alimento": "Arroz branco", "quantidade": 150, "calorias": 204 },
            { "alimento": "Feijão carioca", "quantidade": 100, "calorias": 76 },
            { "alimento": "Bife grelhado", "quantidade": 120, "calorias": 350 }
          ],
          "total_calorias": 630
        }

        Se não conseguir identificar nenhum alimento, retorne um array "itens" vazio e "total_calorias" como 0.
        Não inclua nada na sua resposta além do objeto JSON.
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { "url": image } },
                    ],
                },
            ],
            max_tokens: 1000, // Aumentado um pouco para acomodar mais itens
        });

        const aiResultString = completion.choices[0].message.content;
        const parsedResult = JSON.parse(aiResultString);

        // Retorna o objeto JSON completo (que agora contém a lista de itens e o total)
        return response.status(200).json(parsedResult);

    } catch (error) {
        console.error('Erro geral na função da API:', error);
        return response.status(500).json({ error: 'Falha interna do servidor.', details: error.message });
    }
}
