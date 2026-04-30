exports.handler = async function(event, context) {
  // Pega a URL enviada pelo front-end
  const urlDoProduto = event.queryStringParameters.url;

  if (!urlDoProduto) {
    return { statusCode: 400, body: JSON.stringify({ erro: "URL não fornecida" }) };
  }

  try {
    // Faz a requisição para o site do Super Koch
    const resposta = await fetch(urlDoProduto, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
      }
    });

    // Pega o código-fonte da página como texto
    const html = await resposta.text();

    let linkDaImagem = null;

    // 1ª TENTATIVA: Usando a estrutura exata do print que você mandou
    // Procura a classe "product-image-gallery-active-image", avança até achar a tag "<img" e captura o "src"
    const regexGaleria = /class=["']product-image-gallery-active-image["'][\s\S]*?<img[^>]+src=["'](.*?)["']/i;
    const resultadoGaleria = html.match(regexGaleria);

    if (resultadoGaleria && resultadoGaleria[1]) {
        linkDaImagem = resultadoGaleria[1];
    } 
    // 2ª TENTATIVA (Plano B de segurança): Meta Tag do WhatsApp
    // Como o site parece usar React (pelos nomes das classes), às vezes a imagem 
    // demora uma fração de segundo a mais para carregar. Se a busca acima falhar,
    // ele tenta pegar a imagem invisível usada para o WhatsApp (que carrega instantaneamente).
    else {
        const regexMeta = /<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i;
        const resultadoMeta = html.match(regexMeta);
        
        if (resultadoMeta && resultadoMeta[1]) {
            linkDaImagem = resultadoMeta[1];
        }
    }

    // Retorna o resultado para o seu front-end
    if (linkDaImagem) {
      return {
        statusCode: 200,
        body: JSON.stringify({ imagem: linkDaImagem })
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ erro: "Imagem não encontrada. O site pode estar bloqueando a leitura ou exigindo renderização de JavaScript." })
      };
    }

  } catch (erro) {
    return {
      statusCode: 500,
      body: JSON.stringify({ erro: "Falha ao acessar o site." })
    };
  }
};
