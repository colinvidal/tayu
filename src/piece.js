import React, { Component } from 'react';
import classNames from 'classnames';
import './piece.css';

export default class extends Component {
  constructor(props) {
    super(props);
    const { shape } = this.props;
    let first = true;
    this.draw = shape
      .map((connector, idx) => {
        if (connector) {
          switch (idx) {
            case 0:
              first = false;
              return 'M 20 0 L 20 20';
            case 1:
              if (first) {
                first = false;
                return 'M 40 20 L 20 20';
              }
              return 'L 40 20 L 20 20';
            case 2:
              if (first) {
                first = false;
                return 'M 40 60 L 20 60';
              }
              return 'L 20 60 L 40 60 L 20 60';
            case 3:
              if (first) {
                first = false;
                return 'M 40 100 L 20 100';
              }
              return 'L 20 100 L 40 100 L 20 100';
            case 4:
              if (first) {
                first = false;
                return 'M 20 130 L 20 100';
              }
              return 'L 20 120 M 20 100';
            case 5:
              if (first) {
                return 'M 0 100 L 20 100';
              }
              return 'L 20 100 L 0 100 L 20 100';
            case 6:
              return 'L 20 60 L 0 60 L 20 60';
            case 7:
              return 'L 20 20 L 0 20';
            default:
              return '';
          }
        }
        return '';
      })
      .join(' ');
  }

  componentDidUpdate() {
    if (this.props.wrongPosition && !this.prevWrongPosition) {
      const style = this.pieceDom.style;

      this.prevWrongPosition = true;
      style.animation = 'wrongPositionAnim 0.1s 2';
      setTimeout(() => (style.animation = ''), 200);
    } else {
      this.prevWrongPosition = false;
    }
  }

  componentDidMount() {
    const style = this.pieceDom.style;

    style.animation = 'appearAnim 0.1s';
    setTimeout(() => (style.animation = ''), 100);
  }

  render() {
    const {
      position, turn, up, selected,
    } = this.props;
    const down = !up;
    const off = up ? 0 : 3;
    const gridColumn = `${position.gridColumn}/${position.gridColumn + off}`;
    const gridRow = `${position.gridRow}/${position.gridRow + off}`;

    return (
      <svg
        ref={el => (this.pieceDom = el)}
        className={classNames('Piece', { selected, down })}
        style={{
          transform: `rotate(${turn}turn)`,
          gridColumn,
          gridRow,
        }}
      >
        <path d={this.draw} />
      </svg>
    );
  }
}
