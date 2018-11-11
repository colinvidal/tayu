export const NEW_GAME = 'NEW_GAME';
export const GET_PIECE = 'GET_PIECE';
export const PUT_PIECE = 'PUT_PIECE';
export const LEFT_TURN_PIECE = 'LEFT_TURN_PIECE';
export const RIGHT_TURN_PIECE = 'RIGHT_TURN_PIECE';
export const MOVE_MOUSE = 'MOVE_MOUSE';
export const LOAD_GAME = 'LOAD_GAME';
export const CONNECTED = 'CONNECTED';
export const LOADING_FROM_SERVER = 'LOADING_FROM_SERVER';

export const loadingFromServer = loading => ({
  type: LOADING_FROM_SERVER,
  loading
})

export const connected = ws => ({
  type: CONNECTED,
  ws
});

export const newGame = () => ({
  type: NEW_GAME,
});

export const getPiece = () => ({
  type: GET_PIECE,
});

export const putPiece = () => ({
  type: PUT_PIECE,
});

export const leftTurnPiece = () => ({
  type: LEFT_TURN_PIECE,
});

export const rightTurnPiece = () => ({
  type: RIGHT_TURN_PIECE,
});

export const moveMouse = position => ({
  type: MOVE_MOUSE,
  position,
});

export const loadGame = state => ({
  type: LOAD_GAME,
  state,
});
