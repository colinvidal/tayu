import { createStore, combineReducers, applyMiddleware } from 'redux';
import shapes from './shapes';
import {
  NEW_GAME,
  GET_PIECE,
  PUT_PIECE,
  LEFT_TURN_PIECE,
  RIGHT_TURN_PIECE,
  MOVE_MOUSE,
  LOAD_GAME,
  CONNECTED,
  LOADING_FROM_SERVER,
} from './actions';
import {
  doublesLeft,
  doublesRight,
  doublesTop,
  doublesBottom,
} from './doubles';

const newPiece = (key, shape) => ({
  key,
  shape,
  position: {
    gridColumn: undefined,
    gridRow: undefined,
  },
  turn: 0,
  up: true,
  wrongPosition: false,
});

const isPositionValid = (piece, used) => {
  const { gridColumn, gridRow } = piece.position;

  if (piece.up && gridRow > 16) {
    return false;
  } else if (!piece.up && gridColumn > 16) {
    return false;
  }

  if (used.length === 0) {
    if (piece.up) {
      if (
        !(
          (gridColumn === 9 && gridRow === 8) ||
            (gridColumn === 9 && gridRow === 9) ||
            (gridColumn === 10 && gridRow === 8) ||
            (gridColumn === 10 && gridRow === 9)
        )
      ) {
        return false;
      }
    } else if (!piece.up) {
      if (
        !(
          (gridColumn === 8 && gridRow === 9) ||
            (gridColumn === 9 && gridRow === 9) ||
            (gridColumn === 8 && gridRow === 10) ||
            (gridColumn === 9 && gridRow === 10)
        )
      ) {
        return false;
      }
    }
  } else {
    let validFound = false;

    for (let i = 0; i < used.length; i++) {
      const usedPiece = used[i];

      if (overlap(piece, usedPiece)) {
        return false;
      }

      const {
        validConnection,
        invalidConnection,
      } = compatibles(piece, usedPiece);

      if (validConnection) {
        validFound = true;
      }

      if (invalidConnection) {
        return false;
      }
    }

    if (!validFound) {
      return false;
    }
  }

  return true;
}

const getPiece = ({
  next,
  used,
  current,
  position,
  gameOver,
}, nextI = undefined) => {
  if (current || gameOver) {
    return undefined;
  }

  if (next.length === 0) {
    return {
      gameOver: true,
    };
  }

  const { gridColumn, gridRow } = position;
  const i = nextI >= 0 ? nextI : Math.floor(Math.random() * next.length);
  const newCurrent = {
    ...next[i],
    position: {
      gridColumn,
      gridRow: gridRow > 16 ? 16 : gridRow,
    },
  };
  let newGameOver = true;
  let hint = undefined;

  // The algorithm is absolutely stupid and dramatically
  // expensive. Make something better (for instance, keep track of
  // free connector of each used piece to directly test is connection
  // is possible on them.
  for (let i = 1; i <= 18 && newGameOver; i++) {
    for (let j = 1; j <= 18 && newGameOver; j++) {
      for (let k = 0; k < 1 && newGameOver; k += .25) {
        const candidate = {
          ...newCurrent,
          position: {
            gridColumn: i,
            gridRow: j
          },
          up: k === 0 || k === .5,
          turn: k
        };

        newGameOver = !isPositionValid(candidate, used);
        if (!newGameOver) {
          hint = {
            position: {
              gridColumn: i,
              gridRow: j
            },
            turn: k
          };
        }
      }
    }
  }

  return {
    nextI: i,
    next: i ? [...next.slice(0, i), ...next.slice(i + 1)] : next.slice(1),
    current: newCurrent,
    hint,
    gameOver: newGameOver,
  };
};

const initPieces = () => {
  let key = 0;

  return {
    next: shapes.reduce((shapes, shape) => {
      shapes.push(newPiece(key++, shape));
      shapes.push(newPiece(key++, shape));
      shapes.push(newPiece(key++, shape));
      return shapes;
    }, []),
    current: undefined,
    used: [],
    position: {
      gridColumn: 1,
      gridRow: 1,
    },
    hint: undefined,
    gameOver: false,
    score: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
  };
};

const sameSlot = (s1, s2) =>
  s1.gridColumn === s2.gridColumn && s1.gridRow === s2.gridRow;

const pieceSlots = (piece) => {
  //  UP           DOWN
  // +---+    +---~---~---+
  // | 0 |    | 0   1   2 |
  // | 1 |    +---~---~---+
  // | 2 |
  // +---+

  const { gridColumn, gridRow } = piece.position;

  if (piece.up) {
    return [
      { gridColumn, gridRow },
      { gridColumn, gridRow: gridRow + 1 },
      { gridColumn, gridRow: gridRow + 2 },
    ];
  }
  return [
    { gridColumn, gridRow },
    { gridColumn: gridColumn + 1, gridRow },
    { gridColumn: gridColumn + 2, gridRow },
  ];
};

const pieceAdjacentSlots = ({ up, position }) =>
  //                          0
  //                        +---+
  //                       7| 0 |1
  //                       6| 1 |2
  //                       5| 2 |3
  //                        +---+
  //                          4
  //          UP                             DOWN
  //          c                          c   c+1 c+2
  //          r-1                        r-1 r-1 r-1
  //         +---+                      +---~---~---+
  // c-1 r   | 0 | c+1 r          c-1 r | 0   1   2 | c+3 r
  // c-1 r+1 | 1 | c+1 r+1              +---~---~---+
  // c-1 r+2 | 2 | c+1 r+2               c   c+1 c+2
  //         +---+                       r+1 r+1 r+1
  //          c
  //          r+3

  [
    // [c up, r up, c down, r down
    [0, -1, -1, 0], // 0
    [1, 0, 0, -1], // 1
    [1, 1, 1, -1], // 2
    [1, 2, 2, -1], // 3
    [0, 3, 3, 0], // 4
    [-1, 2, 2, 1], // 5
    [-1, 1, 1, 1], // 6
    [-1, 0, 0, 1], // 7
  ].map(shifts => ({
    gridColumn: up
      ? position.gridColumn + shifts[0]
      : position.gridColumn + shifts[2],
    gridRow: up ? position.gridRow + shifts[1] : position.gridRow + shifts[3],
  }));

const overlap = (p1, p2) => {
  const slots1 = pieceSlots(p1);
  const slots2 = pieceSlots(p2);

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (sameSlot(slots1[i], slots2[j])) {
        return true;
      }
    }
  }

  return false;
};

const compatibles = (current, usedPiece) => {
  const slots = pieceSlots(current);
  const usedSlots = pieceSlots(usedPiece);
  const compat = {
    invalidConnection: false,
    validConnection: false,
  };

  pieceAdjacentSlots(usedPiece).forEach((usedAdjacentSlot, usedFace) => {
    slots.forEach((currentSlot, iCurrentSlot) => {
      if (sameSlot(currentSlot, usedAdjacentSlot)) {
        const c1 = connector(usedPiece, usedFace);
        let usedSlot;

        if (usedFace === 0 || usedFace === 1 || usedFace === 7) {
          usedSlot = usedSlots[0];
        } else if (usedFace === 2 || usedFace === 6) {
          usedSlot = usedSlots[1];
        } else {
          usedSlot = usedSlots[2];
        }

        pieceAdjacentSlots(current).forEach((adjacentSlot, currentFace) => {
          if (sameSlot(adjacentSlot, usedSlot)) {
            const c2 = connector(current, currentFace);

            if (c1 !== c2) {
              compat.invalidConnection = true;
            } else if (c1 && c2) {
              compat.validConnection = true;
            }
          }
        });
      }
    });
  });

  return compat;
}

const connector = (piece, i) => {
  const turn = piece.turn % 1;

  if (turn === 0.25 || Math.abs(turn) === 0.5 || turn === -0.75) {
    const effectiveShape = [...piece.shape];
    let shift = 4;

    while (shift !== 0) {
      effectiveShape.unshift(effectiveShape.pop());
      shift--;
    }
    return effectiveShape[i];
  }
  return piece.shape[i];
};

const putPiece = ({
  score, used, current, gameOver,
}) => {
  if (!current || gameOver) {
    return undefined;
  }

  if (!isPositionValid(current, used)) {
    return {
      current: {
        ...current,
        wrongPosition: true
      }
    };
  }

  const up = current.up;
  let left = score.left;
  let right = score.right;
  let top = score.top;
  let bottom = score.bottom;

  const isDouble = (doubles, slot) => {
    for (let i = doubles.length - 1; i >= 0; i--) {
      if (sameSlot(slot, doubles[i])) {
        return true;
      }
    }
    return false;
  };

  pieceSlots(current).forEach((slot, i) => {
    const { gridColumn, gridRow } = slot;

    if (gridColumn === 1) {
      if (
        (up && connector(current, 7 - i)) ||
        (!up && i === 0 && connector(current, 0))
      ) {
        isDouble(doublesLeft, slot) ? (left += 2) : left++;
      }
    } else if (gridColumn === 18) {
      if (
        (up && connector(current, i + 1)) ||
        (!up && i === 2 && connector(current, 4))
      ) {
        isDouble(doublesRight, slot) ? (right += 2) : right++;
      }
    }

    if (gridRow === 1) {
      if ((up && connector(current, 0)) || (!up && connector(current, i + 1))) {
        isDouble(doublesTop, slot) ? (top += 2) : top++;
      }
    } else if (gridRow === 18) {
      if ((up && connector(current, 4)) || (!up && connector(current, 7 - i))) {
        isDouble(doublesBottom, slot) ? (bottom += 2) : bottom++;
      }
    }
  });

  return {
    score: {
      left,
      right,
      top,
      bottom,
    },
    used: [
      ...used,
      {
        ...current,
        wrongPosition: false,
      },
    ],
    current: undefined,
    hint: undefined
  };
};

const turnPiece = (current, type) => {
  if (!current) {
    return undefined;
  }

  const { gridColumn, gridRow } = current.position;

  if (current.up && (gridColumn === 1 || gridColumn === 18)) {
    return current;
  }

  if (!current.up && (gridRow === 1 || gridRow === 18)) {
    return current;
  }

  return {
    ...current,
    turn: current.turn + (type === LEFT_TURN_PIECE ? -0.25 : 0.25),
    up: !current.up,
    wrongPosition: false,
    position: {
      gridColumn: current.up ? gridColumn - 1 : gridColumn + 1,
      gridRow: current.up ? gridRow + 1 : gridRow - 1,
    },
  };
};

const movePiece = (current, { gridColumn, gridRow }) => {
  if (!current) {
    return undefined;
  }

  if ((current.up && gridRow > 16) || (!current.up && gridColumn > 16)) {
    return current;
  }

  return {
    ...current,
    position: { gridColumn, gridRow },
    wrongPosition: false,
  };
};

const moveMouse = (state, position) => ({
  current: movePiece(state.current, position),
  position,
});

const serverLink = (state = {}, action) => {
  switch(action.type) {
    case CONNECTED:
      return {
        ...state,
        ws: action.ws
      }
    case LOADING_FROM_SERVER:
      return {
        ...state,
        loading: action.loading
      }
    default:
      return state;
  }
};

const pieces = (state = initPieces(), action) => {
  switch (action.type) {
    case NEW_GAME:
      return initPieces();
    case GET_PIECE:
      return {
        ...state,
        ...getPiece(state, action.nextI),
      };
    case PUT_PIECE:
      return {
        ...state,
        ...putPiece(state),
      };
    case LEFT_TURN_PIECE:
    case RIGHT_TURN_PIECE:
      return {
        ...state,
        current: turnPiece(state.current, action.type),
      };
    case MOVE_MOUSE:
      return {
        ...state,
        ...moveMouse(state, action.position),
      };
    case LOAD_GAME:
      return action.state.pieces;
    default:
      return state;
  }
};

const logger = store => next => (action) => {
  console.log(`---[${Math.floor(window.performance.now())}]-----------------`);
  console.log('dispatching', action);
  const result = next(action);
  console.log('next state', store.getState());
  return result;
};

const serverHook = store => next => (action) => {
  const ws = store.getState().serverLink.ws;
  const result = next(action);

  if (ws && !action.fromWS && action.type !== LOADING_FROM_SERVER) {
    const sentAction = action.type === GET_PIECE ? { ...action, nextI: store.getState().pieces.nextI } : action;
    ws.send(JSON.stringify(sentAction));
  }
  return result;
};

export default (preloadedState = undefined) =>
  createStore(
    combineReducers({
      pieces,
      serverLink
    }),
    preloadedState,
    applyMiddleware(logger, serverHook),
  );
