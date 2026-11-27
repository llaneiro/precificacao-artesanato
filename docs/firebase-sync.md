# Arquitetura de sincronização com o Firebase

## Visão geral

O Precifica Arte utiliza o SQLite para persistência local e o Cloud Firestore para sincronização remota, por meio do SDK Firestore Lite. Essa arquitetura permite trabalhar com os dados armazenados no dispositivo e sincronizar as alterações enquanto o aplicativo está ativo e conectado à internet.

As alterações locais são registradas automaticamente por triggers do SQLite em uma fila persistente. O serviço de sincronização processa essa fila e realiza novas tentativas em caso de falha. Cada documento possui um identificador global, uma revisão e um marcador de exclusão, utilizados para identificar registros entre dispositivos e acompanhar suas alterações.

## Estrutura dos dados remotos

Na versão 2 da estrutura de sincronização, os documentos são organizados em coleções vinculadas ao identificador da conta autenticada (`users/{uid}`).

| Coleção | Finalidade |
| --- | --- |
| `materials` | Cadastro de materiais |
| `products` | Cadastro de produtos |
| `productMaterials` | Associação entre produtos e materiais |
| `materialCostHistory` | Histórico de custos dos materiais |
| `fixedExpenses` | Despesas fixas |
| `additionalExpenses` | Despesas adicionais |
| `productAdditionalExpenses` | Associação entre produtos e despesas adicionais |
| `pricingHistory` | Histórico de precificações |
| `settings` | Configurações financeiras, lembretes e conclusão do guia inicial |
| `productPhotos` | Cópias compactadas das fotos dos produtos |

A coleção `settings` contém os documentos `pricing`, `dashboard` e `onboarding`. A estrutura utiliza campos organizados diretamente no Firestore, inclusive para os dados preservados nos históricos de precificação, em substituição ao formato anterior baseado em JSON serializado. Os identificadores globais e as revisões existentes são preservados na migração.

## Fluxo de sincronização

### Envio das alterações

1. O usuário realiza uma operação no aplicativo, que é persistida no SQLite.
2. As triggers registram a alteração na fila local de sincronização.
3. O serviço de sincronização envia os registros pendentes ao Firestore enquanto o aplicativo está ativo.
4. Em caso de falha, os registros permanecem disponíveis para novas tentativas.

### Recebimento das alterações

Após processar a fila de envio, o aplicativo consulta as alterações remotas por coleção. A primeira leitura de cada instalação é completa; as seguintes utilizam o último timestamp do servidor como cursor.

A sincronização é realizada no login, no retorno do aplicativo ao primeiro plano (respeitando o intervalo mínimo de 30 segundos) e periodicamente durante o uso. Na ausência de alterações, o intervalo de consulta aumenta progressivamente de um para dois e, posteriormente, cinco minutos, reduzindo leituras desnecessárias.

Os cursores são inclusivos e persistidos na mesma transação SQLite que importa os dados. Em caso de pendência, falha ou rollback, o cursor não avança. Um registro na fronteira da consulta pode ser relido para evitar a perda de alterações com timestamps iguais.

As novas revisões são importadas em uma transação exclusiva quando não existem pendências locais. Durante esse processo, identificadores e referências remotas, incluindo os históricos, são convertidos em identificadores locais sem gerar novos eventos de sincronização.

As telas de listagem são atualizadas após o recebimento de dados, enquanto formulários em edição não são recarregados automaticamente. A conclusão do guia inicial pode ser sincronizada repetidamente entre dispositivos sem duplicação.

## Armazenamento e sincronização de fotos

Para manter o projeto no plano gratuito do Firebase, sem a necessidade de contratar o plano Blaze para utilizar o Cloud Storage, as fotos são armazenadas em uma coleção específica do Firestore: `users/{uid}/productPhotos`.

O arquivo original permanece no dispositivo de origem, enquanto a nuvem recebe uma cópia JPEG compactada, codificada em Base64, com limite de 280.000 caracteres e lado maior de até 1.200 pixels. Reduções adicionais são aplicadas quando necessário.

Cada produto referencia sua foto por um nome UUID. A gravação da foto e do produto é realizada atomicamente na mesma transação remota. As fotos cadastradas antes da implementação dessa integração são reenfileiradas uma única vez.

Em outros dispositivos, a foto é baixada para o diretório local de documentos. A leitura é realizada por referência, sem consultar toda a coleção de imagens. Se a foto estiver indisponível, uma nova tentativa é realizada sem repetir a consulta de alterações.

Cada foto nova é vinculada exclusivamente ao identificador global de um produto. Ao substituir ou remover a foto, ou excluir o produto, a foto anterior é excluída na mesma transação remota. Arquivos já baixados em outros dispositivos podem permanecer no armazenamento local.

Fotos legadas são adotadas quando existe uma única referência confirmada. Referências compartilhadas e imagens órfãs anteriores à atualização são preservadas para revisão, evitando a exclusão de dados sem vínculo comprovado.

## Configuração do Firestore

Antes de utilizar a sincronização, é necessário:

1. Publicar as regras de segurança disponíveis em [firestore.rules](../firestore.rules) no projeto Firebase configurado no aplicativo.
2. Configurar a isenção de indexação do campo `base64` da coleção `productPhotos`, conforme [firestore.indexes.json](../firestore.indexes.json).
3. Caso o projeto Firebase seja compartilhado com outras aplicações, revisar as regras existentes antes de substituí-las.

A solução foi implementada sem alteração para um plano de cobrança superior. Os limites de utilização do Firestore continuam aplicáveis, inclusive às consultas incrementais e ao armazenamento de imagens.

## Compatibilidade e migração de dados

A estrutura anterior utilizava a coleção `syncRecords`, que permanece disponível somente para leitura pelo proprietário dos dados.

Na primeira execução por conta e instalação, o aplicativo copia os documentos legados ainda não migrados para as coleções atuais, preservando revisões e marcadores de exclusão. Documentos já migrados não são sobrescritos, e os registros antigos não são removidos automaticamente. Após essa etapa, a fila de alterações é enviada à estrutura atual.

Clientes antigos não possuem permissão para gravar na coleção legada. A migração deve ser conferida no console do Firebase antes de qualquer exclusão manual de registros antigos.

## Limitações e validação

A arquitetura foi desenvolvida para atender às necessidades atuais do aplicativo. As principais limitações são:

- Não há resolução geral automática de conflitos. Uma divergência de revisão preserva a alteração pendente no dispositivo, em vez de sobrescrever o registro remoto.
- Os registros são enviados individualmente, com exceção das operações atômicas de produto e foto. A leitura das diferentes coleções não representa um snapshot remoto atômico.
- Dependências incompletas impedem a importação até uma nova tentativa.
- Consultas incrementais, mesmo sem resultados, consomem a leitura mínima aplicável por coleção.
- O limite preventivo por carga JSON é de 700.000 bytes.
- Não há garantia de envio das alterações enquanto o aplicativo está fechado.

A importação foi validada em testes com SQLite local e um adaptador Node.js. A sincronização entre dois aparelhos reais ainda precisa ser validada, incluindo restauração de dados, envio e recebimento de fotos, substituição e remoção de imagens e utilização offline.
