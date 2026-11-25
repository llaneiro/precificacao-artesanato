# Sincronização automática — etapa de envio

O SQLite permanece como fonte local. Triggers registram alterações na fila persistente; o worker envia registros ao Firestore Lite enquanto o aplicativo está ativo, com novas tentativas após falhas. Cada documento possui identidade global, revisão e marcador de exclusão.

## Estrutura remota (versão 2)

Sob users/{uid}: materials, products, productMaterials, materialCostHistory,
fixedExpenses, additionalExpenses, productAdditionalExpenses, pricingHistory
e settings (documentos pricing, dashboard e onboarding). Campos estruturados,
inclusive snapshot do histórico, substituem o JSON serializado remoto.
IDs e revisões anteriores são preservados.

## Migração
Publique as novas regras de firestore.rules no projeto Firebase configurado no aplicativo.
Revise regras de outras aplicações antes de substituir o arquivo inteiro.
A coleção anterior syncRecords fica somente para leitura, restrita ao proprietário.
Na primeira execução por conta e instalação o app copia documentos legados ainda não
migrados, preservando a revisão e os marcadores de exclusão; não sobrescreve
documentos já migrados nem apaga os antigos. Depois envia a fila para as novas
coleções. Clientes antigos não podem gravar no legado. Verifique a migração
no console antes de considerar qualquer remoção manual do legado.
As regras novas precisam estar publicadas antes de usar esta versão.

## Recebimento automático
Após enviar a fila, consulta alterações desde o último timestamp de servidor
por coleção, no login, ao voltar ao primeiro plano (intervalo mínimo de 30s)
e periodicamente enquanto ativo. Quando não há alterações, aumenta o intervalo
de 1 para 2 e depois 5 minutos. Os cursores inclusivos são persistidos na mesma
transação SQLite da importação; uma pendência, falha ou rollback não os avança.
O registro na fronteira pode ser relido para evitar perder timestamps iguais.
A primeira leitura por instalação é completa; consultas vazias também consomem
a leitura mínima do Firestore. Aplica revisões novas em transação exclusiva
quando não há pendências locais; converte IDs remotos e referências históricas
para IDs locais e não gera novos eventos na fila.
A conclusão do guia é idempotente entre dispositivos. Telas de listagem
atualizam ao receber dados; formulários em edição não são recarregados.

## Limitações atuais
Ainda não há resolução geral automática de conflitos.
Uma revisão divergente preserva a fila local em vez de sobrescrever o servidor.
Registros são enviados individualmente; a leitura das coleções não é um
snapshot remoto atômico. Dependências incompletas bloqueiam a importação
até uma nova tentativa. A leitura incremental mantém um custo mínimo por coleção consultada.
O limite preventivo por carga JSON é 700000 bytes. Não há garantia de envio
quando o aplicativo está fechado. Importação testada em SQLite local com
adaptador Node, mas ainda precisa de teste real em dois aparelhos.

## Fotos de produtos
Cloud Storage exige Blaze; para o MVP, usa-se uma coleção separada
users/{uid}/productPhotos, com JPEG em Base64 limitado a 280000 caracteres.
O original continua no aparelho de origem. A nuvem recebe cópia compactada
com lado maior de até 1200 pixels (reduções adicionais quando necessário).
O produto referencia a foto por nome UUID; a foto e o produto são gravados atomicamente na mesma transação. As fotos já cadastradas são reenfileiradas uma vez.
Outros aparelhos baixam uma cópia JPEG no diretório de documentos local;
a leitura não consulta a coleção de fotos inteira. Foto ausente é tentada novamente sem repetir a consulta de alterações.
Cada foto nova é vinculada exclusivamente ao ID global de um produto; troca,
remoção ou exclusão do produto apaga a foto anterior na mesma transação.
Fotos legadas ainda referenciadas são adotadas quando têm uma única referência
confirmada; referências compartilhadas e órfãos anteriores à atualização
são preservados para revisão, evitando apagar dados sem prova de vínculo.
Arquivos locais já baixados em outros aparelhos podem permanecer no disco. Nenhum upgrade de cobrança foi feito.
Publique firestore.rules e desative a indexação de productPhotos.base64
conforme firestore.indexes.json. O limite de uso do Firestore continua aplicável.
Valide upload, download, troca, remoção e uso offline em aparelhos reais.
