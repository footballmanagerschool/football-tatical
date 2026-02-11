# ⚽ Tactical Football Manager - Professional Edition

Uma base sólida de jogo de futebol tático em Phaser 3 com arquitetura modular, IA defensiva avançada e visuais profissionais.

## 🎯 Visão Geral

Este projeto foi reestruturado de um protótipo simples para uma base de jogo comercial escalável, com:

- ✅ Arquitetura modular e orientada a sistemas
- ✅ IA defensiva tática com FSM (Finite State Machine)
- ✅ Sistema de zonas dinâmicas
- ✅ Defesa coordenada (pressing, covering, interception)
- ✅ Visuais procedurais preparados para spritesheets
- ✅ Performance otimizada
- ✅ Facilmente escalável (3v3 → 5v5 → 11v11)

---

## 📁 Estrutura do Projeto

```
/
├── index.html                  # Arquivo principal
├── utils/
│   ├── MathHelpers.js         # Funções matemáticas e táticas
│   └── GameConfig.js          # Configurações centralizadas
├── entities/
│   ├── PlayerStates.js        # FSM - Estados dos jogadores
│   └── Player.js              # Classe Player com visuais e lógica
├── systems/
│   ├── ZoneSystem.js          # Sistema de zonas táticas
│   ├── DefenseSystem.js       # Coordenação defensiva
│   ├── MovementSystem.js      # Física e movimento
│   ├── DecisionSystem.js      # IA e decisões
│   └── RenderSystem.js        # Renderização
└── scenes/
    └── GameScene.js           # Cena principal do jogo
```

---

## 🏗️ Arquitetura

### Princípios Fundamentais

1. **Separação de Responsabilidades**
   - Player = Dados + Visuais (não decide sozinho)
   - Systems = Lógica global e coordenação
   - Scene = Orquestração e lifecycle

2. **Sistema de Estados (FSM)**
   - Cada estado tem enter/update/exit limpo
   - Transições explícitas e baseadas em condições
   - Estados: IDLE, DEFENSIVE, PRESSING, COVERING, INTERCEPTING, RECOVERING

3. **Coordenação Defensiva**
   - Apenas 1 jogador PRESSING por vez
   - Apenas 1 jogador COVERING
   - Prioridades claras e sistema anti-conflito

4. **Performance**
   - Decisões periódicas (não a cada frame)
   - Delays de reação humanos (200-400ms)
   - Cálculos otimizados

---

## 🎮 Sistemas Principais

### 1. DefenseSystem
Coordena a defesa tática:
- Gerencia pressing priority
- Atribui covering automático
- Coordena interceptions
- Mantém compactação defensiva
- Marcação homem-a-homem

### 2. DecisionSystem
IA central que:
- Atualiza estados FSM
- Aplica delays de reação
- Coordena entre sistemas
- Executa decisões com stamina/pressure

### 3. MovementSystem
Gerencia física pura:
- Velocidade baseada em stamina
- Multiplicadores de habilidades
- Field bounds enforcement
- Aceleração/deceleração natural

### 4. ZoneSystem
Divisão tática do campo:
- Zonas dinâmicas por time
- Posicionamento ótimo baseado em bola
- Regras de abandono de zona
- Densidade de zona

### 5. RenderSystem
Apenas visuais:
- Rendering do campo
- Animações procedurais
- Efeitos de gol
- UI updates

---

## 👤 Player Class

Cada jogador possui:

```javascript
{
  // Identificação
  team: 1 or 2,
  role: 'DEFENDER' | 'SPEED' | 'SHOOTER' | 'DRIBBLER',
  
  // Stats (modificados por role)
  stats: {
    speed, shootPower, stamina, dribble,
    defense, reaction, aggression
  },
  
  // IA State Machine
  state: 'IDLE' | 'DEFENSIVE' | 'PRESSING' | 'COVERING' | 'INTERCEPTING' | 'RECOVERING',
  
  // Tactical
  zone: 'DEFENSIVE' | 'MID_DEFENSIVE' | 'MID_ATTACKING' | 'ATTACKING',
  markingTarget: Player | null,
  reactionTimer: number,
  
  // Visual (Container-based)
  container: { body, head, shadow, directionIndicator },
  
  // Physics
  sprite: ArcadeSprite (invisible, apenas física)
}
```

---

## 🎨 Visuais

### Design por Role

- **DEFENDER**: Mais largo e robusto (1.1x width)
- **SPEED**: Fino e atlético (0.85x width)
- **SHOOTER**: Padrão balanceado
- **DRIBBLER**: Centro de gravidade baixo (0.9x scale)

### Animações Procedurais

- Inclinação ao correr (15° radians)
- Bounce vertical (2px amplitude, 8 bounces/s)
- Rotação baseada em velocidade
- Estado visual (glow por estado)

### Preparado para Spritesheets

A arquitetura de Container facilita substituição:
```javascript
// Atual: Shapes procedurais
this.body = scene.add.rectangle(...)

// Futuro: Spritesheet
this.body = scene.add.sprite(..., 'player_sheet')
this.body.play('run_animation')
```

---

## 🧠 IA Tática Avançada

### Estados e Comportamentos

**IDLE**
- Recupera stamina
- Move-se lentamente para posição base
- Avalia transições constantemente

**DEFENSIVE**
- Mantém formação
- Posição baseada em bola e zona
- Compactação dinâmica

**PRESSING**
- Ataque agressivo à bola
- Alto consumo de stamina
- Predição de movimento da bola

**COVERING**
- Suporta jogador em pressing
- Posiciona-se em triângulo (bola-presser-cover)
- Prepara interceptação

**INTERCEPTING**
- Calcula ponto de interceptação
- Velocidade máxima
- Reavalia probabilidade constantemente

**RECOVERING**
- Recuperação rápida de stamina (2x rate)
- Movimento lento para zona segura
- Forçado quando stamina < 20%

### Sistema de Prioridades

```
1. PRESSING (máx 1 por time)
2. INTERCEPTING (máx 1 por time)
3. COVERING (máx 1 por time)
4. DEFENSIVE (restante)
5. IDLE (sem ameaça)
```

### Delays Humanos

```javascript
reactionTime = lerp(200ms, 400ms, reactionStat + staminaFactor)
```

Evita comportamento robótico e adiciona realismo.

---

## 🎛️ Configuração Fácil

Todas as configurações em `GameConfig.js`:

```javascript
GameConfig.AI.PRESSING_DISTANCE = 250;
GameConfig.AI.REACTION_TIME_MIN = 200;
GameConfig.PHYSICS.PLAYER.ACCELERATION = 12;
GameConfig.VISUAL.RUN_LEAN_ANGLE = 0.15;
```

Altere valores sem tocar no código lógico.

---

## 🚀 Como Expandir

### Adicionar Jogadores

1. Edite `GameConfig.FORMATIONS`
```javascript
FIVE_PLAYERS: {
  team1: [
    { role: 'DEFENDER', x: 200, y: 400 },
    { role: 'DEFENDER', x: 300, y: 300 },
    // ... mais 3
  ]
}
```

2. Use na GameScene
```javascript
const formation = GameConfig.FORMATIONS.FIVE_PLAYERS;
```

### Adicionar Novo Estado

1. Em `PlayerStates.js`:
```javascript
ATTACKING: {
  name: 'ATTACKING',
  enter(player) { ... },
  update(player, context) { ... },
  exit(player) { ... },
  shouldTransition(player, context) { ... }
}
```

2. Adicione transições nos outros estados

### Adicionar Nova Habilidade

1. Em `GameConfig.js`:
```javascript
TIMING: {
  SUPER_TACKLE_DURATION: 3000
}
```

2. Em `Player.js`:
```javascript
if (player.specialAbility === 'superTackle') {
  // lógica
}
```

### Substituir por Spritesheets

1. Carregue spritesheet em `preload()`
2. Em `Player.createBodyShape()`:
```javascript
this.body = scene.add.sprite(0, -8, 'player_sheet');
this.body.play('idle');
```

3. Adicione animações
```javascript
scene.anims.create({
  key: 'run',
  frames: scene.anims.generateFrameNumbers('player_sheet', 
    { start: 0, end: 7 }),
  frameRate: 10,
  repeat: -1
});
```

---

## 📊 Performance

### Otimizações Implementadas

- ✅ Decisões periódicas (150ms interval)
- ✅ Delays de reação (evita recálculo constante)
- ✅ Cálculos caros apenas quando necessário
- ✅ Física gerenciada por Arcade (nativa)
- ✅ Sem loops desnecessários em update()

### Escalabilidade

- 3v3: ~60 FPS
- 5v5: ~60 FPS (estimado)
- 11v11: 55+ FPS (estimado, com otimizações)

---

## 🎯 Controles

| Ação | Tecla |
|------|-------|
| Mover | W, A, S, D |
| Chutar | SPACE |
| Dash/Drible | SHIFT |
| Habilidade Especial | E |
| Trocar Jogador | TAB |
| Pausar | P |

---

## 🐛 Debug

Ative debug em `GameConfig.js`:

```javascript
DEBUG: {
  SHOW_ZONES: true,           // Mostra zonas táticas
  SHOW_STATES: true,           // Mostra estado atual
  SHOW_DECISION_RAYS: true,    // Mostra linhas de decisão
  LOG_STATE_TRANSITIONS: true  // Console logs
}
```

E em `index.html`:
```javascript
physics: {
  arcade: {
    debug: true  // Mostra collision boxes
  }
}
```

---

## 📝 Próximos Passos Sugeridos

1. **Sistema de Passes**
   - Implementar `evaluatePassOptions()` completo
   - Adicionar estado PASSING
   - Lógica de recepção

2. **Formações Dinâmicas**
   - 4-3-3, 4-4-2, 3-5-2
   - Mudança tática mid-game

3. **Spritesheets & Animações**
   - Substituir shapes por sprites
   - Animações de corrida, chute, tackle

4. **Sistema de Faltas**
   - Detecção de colisões agressivas
   - Cartões amarelos/vermelhos
   - Free kicks

5. **Multiplayer Online**
   - Integração com servidor
   - Sincronização de física

6. **Modos de Jogo**
   - Carreira
   - Torneio
   - Training mode

---

## 🎓 Conceitos Aprendidos

### Arquitetura de Jogos

- ✅ Entity-Component-System (ECS adaptado)
- ✅ Finite State Machines
- ✅ System coordination
- ✅ Separation of concerns

### IA de Jogos

- ✅ Tactical AI
- ✅ Formation systems
- ✅ Priority-based decision making
- ✅ Human-like delays

### Otimização

- ✅ Periodic updates
- ✅ Efficient math operations
- ✅ Object pooling concepts

---

## 📄 Licença

Código base criado para fins educacionais e comerciais.
Phaser 3 é licenciado sob MIT License.

---

## 👨‍💻 Autoria

Arquitetura desenhada para transformar protótipo em base comercial.
Modular, escalável e production-ready.

**Versão:** 1.0.0  
**Engine:** Phaser 3.70.0  
**Arquitetura:** Professional Modular Systems

---

## 💡 Dicas Finais

1. **Leia os comentários nos arquivos** - Cada decisão arquitetural está explicada
2. **Comece pelo GameConfig** - Experimente diferentes valores
3. **Use o Debug Mode** - Visualize zonas e estados
4. **Estude o FSM** - Entenda transições de estados
5. **Modifique gradualmente** - Adicione features uma a uma

---

**🎮 Divirta-se construindo seu jogo de futebol tático!**
