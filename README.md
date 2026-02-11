# Tactical Football Manager

## 🎮 Sobre o Jogo

Um jogo de futebol tático desenvolvido com Phaser 3, onde você controla jogadores do seu time em tempo real.

## 🚀 Como Executar

### Opção 1: Servidor Local Simples

```bash
# Se você tem Python instalado:
python -m http.server 8000

# Ou com Python 3:
python3 -m http.server 8000

# Ou com Node.js (npx):
npx http-server

# Depois acesse: http://localhost:8000
```

### Opção 2: Live Server (VS Code)

1. Instale a extensão "Live Server" no VS Code
2. Clique com botão direito em `index.html`
3. Selecione "Open with Live Server"

## 🎯 Como Jogar

### Controles

- **Mouse**: Clique em um jogador do seu time (vermelho) para selecioná-lo
- **Setas do teclado**: Movem o jogador selecionado
- **Espaço**: Chuta a bola (segure para carregar o chute)
- **ESC**: Pausa o jogo

### Objetivo

- Marcar mais gols que o time adversário
- O jogo dura 5 minutos (configurável)
- Use táticas e posicionamento para vencer!

## 📁 Estrutura do Projeto

```
/
├── index.html                      # Página principal
├── js/
│   ├── GameConfig.js              # Configurações globais
│   ├── MathHelpers.js             # Funções matemáticas
│   ├── Player.js                  # Classe do jogador
│   ├── main.js                    # Inicialização do Phaser
│   ├── systems/                   # Sistemas do jogo
│   │   ├── RenderSystem.js        # Sistema de renderização
│   │   ├── ZoneSystem.js          # Sistema de zonas
│   │   ├── MovementSystem.js      # Sistema de movimento
│   │   ├── DefenseSystem.js       # Sistema de defesa
│   │   ├── DecisionSystem.js      # IA dos jogadores
│   │   ├── BallControlSystem.js   # Controle de bola
│   │   └── ShootingSystem.js      # Sistema de chutes
│   └── scenes/                    # Cenas do jogo
│       ├── MainMenuScene.js       # Menu principal
│       ├── SettingsScene.js       # Configurações
│       └── GameScene.js           # Cena principal do jogo
└── README.md                      # Este arquivo
```

## ⚙️ Configurações

No menu Settings, você pode ajustar:
- **FPS**: 30, 60 ou 120 frames por segundo

## 🔧 Correções Realizadas

### Problemas Corrigidos

1. **Erro "Phaser is not defined"**
   - ✅ Adicionado script do Phaser via CDN no HTML
   - ✅ Ordem correta de carregamento dos scripts

2. **Métodos fora da classe Player**
   - ✅ Movidos `kick()` e `updateRunAnimation()` para dentro da classe
   - ✅ Corrigida sintaxe dos métodos

3. **Sistemas faltando**
   - ✅ Criados todos os sistemas referenciados (Render, Zone, Movement, etc.)
   - ✅ Implementação funcional de cada sistema

4. **Configurações ausentes**
   - ✅ Criado GameConfig.js completo
   - ✅ Adicionados MathHelpers.js

5. **GameScene incompleto**
   - ✅ Implementado update() completo
   - ✅ Adicionada criação de times
   - ✅ Sistema de controle de jogadores
   - ✅ Detecção de gols
   - ✅ Menu de pausa funcional

6. **MainMenuScene e SettingsScene**
   - ✅ Corrigidos botões interativos
   - ✅ Adicionados efeitos hover
   - ✅ Navegação entre cenas funcionando

## 🎨 Recursos

- ✅ Campo de futebol renderizado
- ✅ 8 jogadores (4 por time)
- ✅ Sistema de física Arcade
- ✅ IA básica para jogadores não controlados
- ✅ Sistema de stamina
- ✅ Chute com carga de potência
- ✅ Detecção de gols
- ✅ Placar e cronômetro
- ✅ Menu de pausa
- ✅ Configurações de FPS

## 🚧 Melhorias Futuras

- [ ] Sprites animados para jogadores
- [ ] Mais formações táticas
- [ ] Multiplayer local
- [ ] Sistema de cartões
- [ ] Replay de gols
- [ ] Estatísticas detalhadas
- [ ] Sons e música
- [ ] Diferentes níveis de dificuldade

## 📝 Licença

Projeto educacional - livre para uso e modificação.
