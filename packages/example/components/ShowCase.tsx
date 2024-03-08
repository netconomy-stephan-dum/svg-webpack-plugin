import React from 'react';
import vat from '../svg/vatikan.svg';
import loading from '../svg/default-loading.svg';
import Icon from "./Icon";
import styles from './ShowCase.scss'
console.log(styles);
const ShowCase = () => (
  <ul>
    <li className={styles.test}>
    </li>
    <li>
      <Icon glyph={vat}/>
    </li>
    <li>
      <Icon width={200} glyph={loading}/>
    </li>
  </ul>
);

export default ShowCase;
