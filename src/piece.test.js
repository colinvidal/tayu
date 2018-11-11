import React from 'react';
import ReactDOM from 'react-dom';
import Piece from './piece';

it('render a piece without error', () => {
  const div = document.createElement('div');
  ReactDOM.render(<Piece />, div);
});
