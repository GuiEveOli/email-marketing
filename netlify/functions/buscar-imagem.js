exports.handler = async function(event, context) {
  // Como vamos enviar vários dados, exigimos que o método seja POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ erro: "Use o método POST enviando um JSON com as URLs." }) };
  }

  let urls = [];
  try {
    // Transforma o texto recebido de volta em uma lista do JavaScript
    const body = JSON.parse(event.body);
    urls = body.urls;
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ erro: "Formato inválido. Envie um JSON." }) };
  }

  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ erro: "Nenhuma URL fornecida na lista." }) };
  }

  // Função isolada que cuida de apenas UM link (usando sua Regex anterior)
  const extrairDeUmaUrl = async (urlDoProduto) => {
    try {
      const resposta = await fetch(urlDoProduto, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' }
      });
      
      if (!resposta.ok) return { url: urlDoProduto, imagem: null, status: "Erro ao carregar site" };

      const html = await resposta.text();
      let linkDaImagem = null;

      const regexGaleria = /class=["']product-image-gallery-active-image["'][\s\S]*?<img[^>]+src=["'](.*?)["']/i;
      const resultadoGaleria = html.match(regexGaleria);

      if (resultadoGaleria && resultadoGaleria[1]) {
          linkDaImagem = resultadoGaleria[1];
      } else {
          const regexMeta = /<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i;
          const resultadoMeta = html.match(regexMeta);
          if (resultadoMeta && resultadoMeta[1]) {
              linkDaImagem = resultadoMeta[1];
          }
      }

      return { 
        url: urlDoProduto, 
        imagem: linkDaImagem, 
        status: linkDaImagem ? "Sucesso" : "Imagem não encontrada" 
      };

    } catch (erro) {
      return { url: urlDoProduto, imagem: null, status: "Falha de rede" };
    }
  };

  try {
    // O Promise.all pega nossa lista de URLs e executa a função de extração em todas ao MESMO TEMPO
    const resultados = await Promise.all(urls.map(url => extrairDeUmaUrl(url)));
    
    return {
      statusCode: 200,
      body: JSON.stringify({ resultados: resultados })
    };
  } catch (erro) {
    return { statusCode: 500, body: JSON.stringify({ erro: "Erro crítico ao processar requisições." }) };
  }
};
