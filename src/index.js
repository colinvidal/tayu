import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Board from './board';
import createTayuStore from './store';
import { Provider, connect } from 'react-redux';
import { newGame, getPiece, loadGame, connected, loadingFromServer } from './actions';
import './index.css';
import 'sanitize.css';

import { https, serverPort, serverAddr } from './config';

class Scores extends Component {
  prevScoreV = -1;
  prevScoreH = -1;

  triggerAnimation() {
    const { scoreV, scoreH } = this.props;
    const _triggerAnimation = (style) => {
      style.animation = 'scoreUpdate .3s linear'
      setTimeout(() => style.animation = '', 300);
    }

    if (scoreV !== this.prevScoreV) {
      _triggerAnimation(this.scoreVDom.style);
      this.prevScoreV = scoreV;
    }

    if (scoreH !== this.prevScoreH) {
      _triggerAnimation(this.scoreHDom.style);
      this.prevScoreH = scoreH;
    }
  }

  componentDidMount() {
    this.triggerAnimation();
  }

  componentDidUpdate() {
    this.triggerAnimation();
  }

  render() {
    const { scoreV, scoreH } = this.props;

    return (
      <div style={{padding: '10px'}}>
        <div className="score vertical" ref={el => this.scoreVDom = el}>
          {scoreV}
        </div>
        <div className="score horizontal" ref={el => this.scoreHDom = el}>
          {scoreH}
        </div>
      </div>
    );
  }
}

const ServerHook = connect(state => ({ state }))(({ state, dispatch, children }) => {
  const { ws, loading } = state.serverLink;
  const loadingOutput = (
    <div style={{
      color: '#B2497D',
      fontFamily: 'sans-serif',
      fontSize: '50px',
      marginTop: '50px',
      textAlign: 'center',
      textShadow: '0px 0px 20px #B2497D, 0px 0px 40px #B2497D, 0px 0px 80px #B2497D',
    }}>
      Loading...
    </div>
  );

  if (!ws) {
    const newWS = new WebSocket(`${https ? 'wss' : 'ws'}://${serverAddr}:${serverPort}/tayu-api`);
    dispatch(loadingFromServer(true));

    newWS.onmessage = message => {
      try {
        const actionList = JSON.parse(message.data);
        actionList.forEach(action => dispatch({ ...action, fromWS: true }));
        dispatch(loadingFromServer(false));
      } catch (e) {}
    };

    dispatch(connected(newWS));
    return loadingOutput;
  } else if (loading) {
    return loadingOutput;
  } else {
    return (
      <div>
        {children}
      </div>
    );
  }
});

const Controls = connect(state => ({ state }))(({ state, dispatch }) => {
  const score = state.pieces.score;
  const scoreV = score.top * score.bottom;
  const scoreH = score.left * score.right;

  return (
    <div className="panel">
      <button
        className="control"
        onClick={() => {
          dispatch(newGame());
          dispatch(getPiece());
        }}
      >
        New game
      </button>
      <button
        className="control"
        onClick={() => {
          const b = new Blob([JSON.stringify(state)], {
              type: 'application/json',
          });
          const url = window.URL.createObjectURL(b);
          const a = document.createElement('A');

            a.href = url;
            a.download = 'tayu-state.json';
          document.body.append(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
        }}
      >
        Export state
      </button>
      <input
        className="control"
        type="file"
        id="importState"
        onChange={(evt) => {
          const dump = evt.target.files[0];

          if (dump.type !== 'application/json') {
            alert('JSON format only.');
          } else {
            const b = dump.slice();
            const fr = new FileReader();

            fr.addEventListener('loadend', (evt) => {
              try {
                dispatch(loadGame(JSON.parse(evt.target.result)));
              } catch (e) {
                alert('Error during JSON parsing.');
              }
            });
            fr.readAsText(b);
          }
        }}
      />
      <label className="control" htmlFor="importState">Import state</label>
      <Scores scoreV={scoreV} scoreH={scoreH}/>
    </div>
  );
});

ReactDOM.render(
  <Provider store={createTayuStore()}>
    <ServerHook>
      <Controls />
      <Board />
    </ServerHook>
  </Provider>,
  document.getElementById('root'),
);
