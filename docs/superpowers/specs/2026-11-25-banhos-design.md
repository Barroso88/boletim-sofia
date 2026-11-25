# Registo de banhos (desenho aprovado em 2026-11-25)

## Objetivo
Registar os banhos como já se registam as mamadas, as fraldas e o sono.

## Abordagens
- **Mesmo molde das fraldas (escolhida):** tabela, endereços, funções no cliente, separador e cartão.
- Registo genérico para todos os tipos: obrigaria a reescrever o que já funciona. Rejeitada.

## O que se guarda
Data e hora de cada banho. Sem temperatura nem notas.

## Decisões
- Registos: quarto separador "Banhos"; no telemóvel os separadores ficam 2 x 2. Escolher o dia, registar (hora
  atual, alterável), listar o dia e apagar.
- Início: cartão "Último Banho". O indicador conta em dias a partir de 24 h e fica vermelho a partir de 2 dias.
- Início em ecrãs grandes: cartões em grelha 2 x 2; no telemóvel um por baixo do outro.
- Modo Natal: mesmo estilo dos outros cartões e separadores.
- Servidor: tabela `banhos` criada no arranque; GET/POST/DELETE `/api/banhos`; registo por voz em
  `/api/banhos/registar` e `/api/webhook/banhos`; último banho em `/api/ha/status`.

## Fora do âmbito
Comando de voz configurado dentro do Home Assistant.
