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

        // --- PROMPT MODIFICADO PARA ANÁLISE DE ALIMENTOS E CALORIAS ---
        const prompt = `
        Analise a imagem focando no alimento principal apresentado.
        Sua tarefa é identificar três coisas:
        1. O nome do alimento (ex: "Banana", "Bife grelhado", "Arroz branco").
        2. Uma estimativa da quantidade ou peso em gramas (ex: 120, 200, 150).
        3. O valor calórico total estimado para essa quantidade (ex: 105, 350, 204).

        Formate sua resposta final estritamente como um objeto JSON com três chaves:
        - "alimento": uma string com o nome do alimento.
        - "quantidade": um número representando o peso em gramas.
        - "calorias": um número representando o total de calorias (kcal).

        Se não conseguir identificar alguma das informações, o valor da chave correspondente deve ser null.
        Não inclua nada na sua resposta além do objeto JSON.
        Seja o mais preciso possível na sua estimativa.
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
            max_tokens: 800,
        });

        const aiResultString = completion.choices[0].message.content;
        const parsedResult = JSON.parse(aiResultString);

        // --- RESPOSTA MODIFICADA COM OS DADOS DO ALIMENTO ---
        return response.status(200).json({
            alimento: parsedResult.alimento,
            quantidade: parsedResult.quantidade,
            calorias: parsedResult.calorias
        });

    } catch (error) {
        console.error('Erro geral na função da API:', error);
        return response.status(500).json({ error: 'Falha interna do servidor.', details: error.message });
    }
}