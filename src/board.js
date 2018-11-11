import React from 'react';
import { connect } from 'react-redux';
import {
  leftTurnPiece,
  rightTurnPiece,
  putPiece,
  moveMouse,
  getPiece,
} from './actions';
import Piece from './piece';
import './board.css';
import {
  doublesLeft,
  doublesRight,
  doublesTop,
  doublesBottom,
} from './doubles';

let inhibitWheel = false;

export default connect(
  ({ pieces }) => ({
    pieces: pieces.current
      ? [
        ...pieces.used,
        {
          ...pieces.current,
          selected: true,
        },
      ]
      : pieces.used,
    position: pieces.position,
    gameOver: pieces.gameOver,
  }),
  {
    getPiece,
    moveMouse,
    putPiece,
    leftTurnPiece,
    rightTurnPiece,
  },
)(({
  pieces,
  position,
  gameOver,
  getPiece,
  moveMouse,
  putPiece,
  leftTurnPiece,
  rightTurnPiece,
}) => {
  const onBoardMouseMove = (evt) => {
    const coord = (board, scroll, mouse) => {
      const raw = Math.floor((mouse + scroll - board) / 40);
      if (raw === 0) {
        return 1;
      }

      if (raw === 19) {
        return 18;
      }

      return raw;
    };

    const target = evt.currentTarget;
    const col = coord(target.offsetLeft, window.pageXOffset, evt.clientX);
    const row = coord(target.offsetTop, window.pageYOffset, evt.clientY);
    const { gridColumn, gridRow } = position;

    if (col !== gridColumn || row !== gridRow) {
      moveMouse({ gridColumn: col, gridRow: row });
    }
  };

  const onBoardClick = (evt) => {
    if (evt.button !== 0) {
      return;
    }
    putPiece();
    setTimeout(getPiece, 300);
  };

  const onBoardWheel = (evt) => {
    evt.preventDefault();
    if (!inhibitWheel && evt.deltaY !== 0) {
      inhibitWheel = true;
      setTimeout(() => (inhibitWheel = false), 300);
      if (evt.deltaY > 0) {
        rightTurnPiece();
      } else {
        leftTurnPiece();
      }
    }
  };

  return (
    <div
      className="Board"
      onMouseMove={onBoardMouseMove}
      onClick={onBoardClick}
      onWheel={onBoardWheel}
    >
      <div className="specialSlot" style={{ gridColumn: 9, gridRow: 9 }} />
      <div className="specialSlot" style={{ gridColumn: 10, gridRow: 9 }} />
      <div className="specialSlot" style={{ gridColumn: 9, gridRow: 10 }} />
      <div className="specialSlot" style={{ gridColumn: 10, gridRow: 10 }} />

      {[...doublesLeft, ...doublesRight, ...doublesTop, ...doublesBottom].map(({ gridColumn, gridRow }) => (
        <div className="specialSlot" style={{ gridColumn, gridRow }} />
      ))}

      <div className="grid" />
      <div className="shadow" />

      {pieces.map(piece => <Piece {...piece} />)}

      {gameOver ? <div className="gameOver"/> : ''}
    </div>
  );
});
