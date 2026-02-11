# 📂 Estrutura do Projeto - Guia de Arquivos

## 📖 Índice Rápido

### 🎮 Arquivos Principais
1. [index.html](#indexhtml) - Ponto de entrada
2. [README.md](#readmemd) - Documentação completa

### 🛠️ Utilities
3. [utils/MathHelpers.js](#utilsmathh helpersjs) - Funções matemáticas
4. [utils/GameConfig.js](#utilsgameconfigjs) - Configurações centralizadas

### 👤 Entities
5. [entities/PlayerStates.js](#entitiesplayerstatesjs) - FSM States
6. [entities/Player.js](#entitiesplayerjs) - Classe Player

### ⚙️ Systems
7. [systems/ZoneSystem.js](#systemszonesystemjs) - Zonas táticas
8. [systems/DefenseSystem.js](#systemsdefensesystemjs) - Coordenação defensiva
9. [systems/MovementSystem.js](#systemsmovementsystemjs) - Física e movimento
10. [systems/DecisionSystem.js](#systemsdecisionsystemjs) - IA e decisões
11. [systems/RenderSystem.js](#systemsrendersystemjs) - Renderização

### 🎬 Scenes
12. [scenes/GameScene.js](#scenesgamescenejs) - Cena principal

---

## Detalhamento dos Arquivos

### index.html
**Propósito:** Ponto de entrada da aplicação  
**O que faz:**
- Carrega Phaser 3 via CDN
- Importa todos os módulos na ordem correta
- Inicializa o jogo
- Define estilos básicos

**Importações (ordem importa!):**
1. utils/MathHelpers.js
2. utils/GameConfig.js
3. entities/PlayerStates.js
4. entities/Player.js
5. systems/ZoneSystem.js
6. systems/DefenseSystem.js
7. systems/MovementSystem.js
8. systems/DecisionSystem.js
9. systems/RenderSystem.js
10. scenes/GameScene.js

**Modificar quando:** Adicionar novos módulos

---

### README.md
**Propósito:** Documentação completa do projeto  
**Contém:**
- Visão geral da arquitetura
- Guia de expansão
- Conceitos aprendidos
- Controles e debug

**Ler quando:** Começar a trabalhar no projeto

---

### utils/MathHelpers.js
**Propósito:** Biblioteca de funções matemáticas reutilizáveis  
**Funções principais:**
- `distance()` - Distância entre pontos
- `angleBetween()` - Ângulo entre pontos
- `normalize()` - Normalizar vetor
- `calculateInterception()` - Prever interceptação
- `calculateShootingAngle()` - Ângulo de chute com erro humano
- `randomGaussian()` - Random com distribuição gaussiana

**Usar quando:** Precisar de cálculos matemáticos ou táticos  
**Modificar quando:** Adicionar novos cálculos utilitários

**Exemplo de uso:**
```javascript
const dist = MathHelpers.distance(player.x, player.y, ball.x, ball.y);
const angle = MathHelpers.angleBetween(x1, y1, x2, y2);
```

---

### utils/GameConfig.js
**Propósito:** Configurações centralizadas do jogo  
**Seções:**
- `FIELD` - Dimensões do campo
- `ROLES` - Modificadores de stats por role
- `AI` - Parâmetros de IA (distâncias, delays, stamina)
- `PHYSICS` - Configurações de física
- `TIMING` - Durações e cooldowns
- `VISUAL` - Parâmetros visuais
- `FORMATIONS` - Formações de time
- `DEBUG` - Flags de debug

**Modificar quando:**
- Balancear gameplay
- Ajustar comportamento da IA
- Mudar formações
- Ativar/desativar debug

**Exemplo de modificação:**
```javascript
AI: {
  PRESSING_DISTANCE: 300, // Aumenta alcance de pressing
  REACTION_TIME_MIN: 100  // IA mais rápida
}
```

---

### entities/PlayerStates.js
**Propósito:** Define todos os estados do FSM  
**Estados implementados:**
- **IDLE** - Estado padrão, recupera stamina
- **DEFENSIVE** - Posicionamento defensivo
- **PRESSING** - Ataque agressivo à bola
- **COVERING** - Suporte ao presser
- **INTERCEPTING** - Tentativa de interceptação
- **RECOVERING** - Recuperação de stamina

**Cada estado tem:**
- `enter(player)` - Inicialização
- `update(player, context)` - Comportamento por frame
- `exit(player)` - Limpeza
- `shouldTransition(player, context)` - Condições de transição

**Modificar quando:**
- Adicionar novo estado
- Ajustar comportamento de estado
- Modificar condições de transição

**Exemplo de adição:**
```javascript
ATTACKING: {
  name: 'ATTACKING',
  enter(player) {
    console.log('Entering attack mode');
  },
  update(player, context) {
    // Lógica de ataque
    return { velocityX: ..., velocityY: ... };
  },
  shouldTransition(player, context) {
    if (lostBall) return 'DEFENSIVE';
    return null;
  }
}
```

---

### entities/Player.js
**Propósito:** Classe principal do jogador  
**Responsabilidades:**
- Gerenciar propriedades (stats, estado, posição)
- Criar visualização (Container com body, head, shadow)
- Criar física (sprite invisível)
- Atualizar animações procedurais
- Executar ações (kick, dash, ability)

**Propriedades principais:**
```javascript
{
  team: 1 | 2,
  role: 'DEFENDER' | 'SPEED' | 'SHOOTER' | 'DRIBBLER',
  state: string,  // FSM state
  stats: { speed, shootPower, stamina, ... },
  zone: string,
  markingTarget: Player | null,
  container: Phaser.Container,
  sprite: Phaser.Sprite  // Physics body
}
```

**Métodos principais:**
- `update()` - Atualização por frame
- `setState()` - Transição de estado
- `setVelocity()` - Define velocidade
- `kick()` - Chutar bola
- `activateAbility()` - Habilidade especial

**Modificar quando:**
- Adicionar nova propriedade
- Mudar visuais
- Adicionar nova ação
- Substituir por spritesheet

---

### systems/ZoneSystem.js
**Propósito:** Gerencia divisão tática do campo  
**Responsabilidades:**
- Dividir campo em zonas
- Atribuir jogadores a zonas
- Calcular posição ótima na zona
- Decidir quando abandonar zona

**Zonas por time:**
- DEFENSIVE (25% campo)
- MID_DEFENSIVE (25% campo)
- MID_ATTACKING (25% campo)
- ATTACKING (25% campo)

**Métodos principais:**
- `assignPlayerZones()` - Atribui zonas iniciais
- `getZoneAt(x, y, team)` - Retorna zona de posição
- `getOptimalZonePosition()` - Melhor posição na zona
- `shouldAbandonZone()` - Verifica se deve sair da zona

**Modificar quando:**
- Mudar tamanho de zonas
- Adicionar mais subdivisões
- Modificar regras de abandono

---

### systems/DefenseSystem.js
**Propósito:** Coordena defesa tática do time  
**Responsabilidades:**
- Gerenciar pressing priority (apenas 1)
- Atribuir covering (apenas 1)
- Coordenar interceptions
- Manter compactação defensiva
- Atribuir marcação homem-a-homem

**Métodos principais:**
- `managePressing()` - Seleciona quem pressiona
- `manageCovering()` - Atribui cobertura
- `manageInterceptions()` - Coordena interceptações
- `enforceCompactness()` - Mantém linhas organizadas
- `assignMarking()` - Marcação de adversários

**Modificar quando:**
- Ajustar prioridades defensivas
- Mudar distâncias táticas
- Adicionar novos papéis defensivos

**Variáveis de controle:**
```javascript
this.pressingPlayer = Player | null
this.coveringPlayer = Player | null
this.interceptingPlayers = Array<Player>
```

---

### systems/MovementSystem.js
**Propósito:** Gerencia física e movimento puro  
**Responsabilidades:**
- Atualizar física de todos jogadores
- Aplicar stamina a velocidade
- Enforcar limites do campo
- Calcular movimentos (aceleração, dash, etc)

**Métodos principais:**
- `update()` - Atualiza todos jogadores
- `updatePlayerPhysics()` - Física individual
- `enforceFieldBounds()` - Limites do campo
- `updateStamina()` - Gerencia stamina
- `moveToward()` - Movimento para alvo
- `dash()` - Sprint rápido

**Modificar quando:**
- Ajustar física
- Adicionar novos tipos de movimento
- Mudar consumo de stamina

**Importante:** Sistema puro de física, sem lógica de decisão

---

### systems/DecisionSystem.js
**Propósito:** Coordena decisões da IA  
**Responsabilidades:**
- Atualizar estados FSM
- Aplicar delays de reação
- Executar comportamentos de estado
- Coordenar com outros sistemas
- Calcular kicks e passes

**Fluxo de decisão:**
```
1. Verificar tempo desde última decisão
2. Verificar reaction timer
3. Consultar estado atual (shouldTransition)
4. Aplicar delay se transição
5. Executar estado (update)
6. Aplicar comportamentos adicionais
```

**Métodos principais:**
- `update()` - Coordena IA do time
- `updatePlayer()` - Atualiza jogador individual
- `executeState()` - Executa lógica de estado
- `calculateReactionTime()` - Delay humano
- `attemptKick()` - Tenta chutar

**Modificar quando:**
- Mudar frequência de decisões
- Ajustar delays de reação
- Adicionar novos comportamentos

---

### systems/RenderSystem.js
**Propósito:** Gerencia apenas renderização  
**Responsabilidades:**
- Desenhar campo
- Desenhar gols
- Criar bola
- Atualizar visuais
- Criar/atualizar UI
- Efeitos visuais (goal flash, particles)

**Métodos principais:**
- `renderField()` - Desenha campo completo
- `renderGoals()` - Desenha traves e redes
- `createBall()` - Cria sprite da bola
- `updateBall()` - Atualiza rotação da bola
- `flashGoal()` - Efeito de gol
- `createUI()` - Cria elementos de UI
- `updateUI()` - Atualiza UI

**Modificar quando:**
- Mudar aparência do campo
- Adicionar novos efeitos visuais
- Customizar UI

**Importante:** Apenas renderização, sem lógica de jogo

---

### scenes/GameScene.js
**Propósito:** Cena principal que orquestra tudo  
**Responsabilidades:**
- Inicializar todos os sistemas
- Criar jogadores e times
- Coordenar update loop
- Gerenciar colisões
- Controlar input do jogador
- Gerenciar estado do jogo
- Detecção de gol e out-of-bounds

**Lifecycle:**
```
create()
  ├─ Criar sistemas
  ├─ Renderizar campo
  ├─ Criar jogadores
  ├─ Configurar física
  └─ Iniciar jogo

update(time, delta)
  ├─ Atualizar jogadores
  ├─ Atualizar MovementSystem
  ├─ Atualizar DecisionSystems (Team 1 & 2)
  ├─ Atualizar ZoneSystem
  ├─ Processar input
  ├─ Verificar gol
  ├─ Atualizar UI
  └─ Processar hotkeys
```

**Métodos principais:**
- `create()` - Inicialização
- `update()` - Loop principal
- `createTeams()` - Cria ambos os times
- `controlPlayer()` - Input do jogador
- `checkGoal()` - Detecta gol
- `checkOutOfBounds()` - Bola fora
- `resetPositions()` - Reset após gol

**Modificar quando:**
- Adicionar novos sistemas
- Mudar formações
- Adicionar modos de jogo
- Customizar input

---

## 🔄 Fluxo de Dados

```
GameScene.update()
  │
  ├─> MovementSystem.update(allPlayers)
  │     └─> Atualiza física de cada player
  │
  ├─> DecisionSystem1.update(team1, ball, team2)
  │     ├─> DefenseSystem.update()
  │     │     └─> Coordena pressing/covering/intercept
  │     └─> Para cada AI player:
  │           ├─> Verifica reaction timer
  │           ├─> PlayerStates[state].shouldTransition()
  │           └─> PlayerStates[state].update()
  │                 └─> Retorna velocity
  │
  ├─> DecisionSystem2.update(team2, ball, team1)
  │     └─> (mesmo processo)
  │
  ├─> ZoneSystem.update(ball)
  │     └─> Debug visualization
  │
  ├─> controlPlayer(currentPlayer)
  │     └─> Processa WASD, SPACE, SHIFT, E
  │
  └─> RenderSystem.updateUI(ui, gameState)
        └─> Atualiza score, timer, controls
```

---

## 🎯 Ordem de Leitura Sugerida

Para entender o projeto, leia nesta ordem:

1. **README.md** - Visão geral
2. **GameConfig.js** - Configurações
3. **MathHelpers.js** - Funções básicas
4. **PlayerStates.js** - Estados FSM
5. **Player.js** - Entidade jogador
6. **ZoneSystem.js** - Sistema mais simples
7. **MovementSystem.js** - Física pura
8. **DefenseSystem.js** - Coordenação tática
9. **DecisionSystem.js** - IA central
10. **RenderSystem.js** - Visuais
11. **GameScene.js** - Orquestração
12. **index.html** - Ponto de entrada

---

## 🔧 Onde Modificar Por Tipo de Mudança

### Balancear Gameplay
→ `GameConfig.js`

### Adicionar Novo Estado
→ `PlayerStates.js`

### Mudar Visuais
→ `Player.js` (createVisuals)  
→ `RenderSystem.js` (field, goals)

### Ajustar IA
→ `DecisionSystem.js`  
→ `DefenseSystem.js`

### Adicionar Nova Formação
→ `GameConfig.js` (FORMATIONS)  
→ `GameScene.js` (createTeams)

### Adicionar Novo Role
→ `GameConfig.js` (ROLES)  
→ `Player.js` (createBodyShape)

### Performance
→ `DecisionSystem.js` (intervals)  
→ `GameConfig.js` (AI.DECISION_INTERVAL)

---

## 📊 Estatísticas do Projeto

- **Total de arquivos:** 12
- **Linhas de código:** ~3000+
- **Sistemas:** 5
- **Estados FSM:** 6
- **Roles:** 4
- **Times:** 2
- **Jogadores:** 6 (3v3)

---

## 🎮 Quick Start

1. Abra `index.html` em navegador moderno
2. Pressione 1, 2 ou 3 para escolher jogador
3. Pressione ENTER para iniciar
4. Use WASD para mover
5. SPACE para chutar
6. SHIFT para dash
7. E para habilidade especial
8. TAB para trocar jogador
9. P para pausar

---

**📝 Última atualização:** 11 de Fevereiro de 2026  
**🏗️ Arquitetura:** Modular Professional Systems  
**⚽ Versão:** 1.0.0
