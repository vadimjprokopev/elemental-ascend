import { GameAnimation } from '../animations';
import { State, GameDispatch } from '../../App/context';
import { EnemyState } from '../enemies/enemy';
import { getEnemy, getSpell } from '..';
import { EnemyDiesAnimation } from '../animations/enemies';

export type EnemyActionWrapper = {
  getAnimation: (enemy: number, state: State) => GameAnimation;
  getDescription: (state: State, enemyState: EnemyState) => string;
  getAction: (enemy: number, state: State) => void;
};

export async function makeATurn(
  originalTarget: number,
  dispatch: GameDispatch,
): Promise<void> {
  dispatch({ type: 'endTurn' });

  dispatch(async (dispatch, getState) => {
    const { currentSpell, spells } = getState();

    await getSpell(spells[currentSpell].name).cast(
      originalTarget,
      getState(),
      dispatch,
    );

    const { enemies } = getState();

    const diedEnemies = enemies.reduce((acc: number[], cur, index) => {
      if (cur.health <= 0) {
        acc.push(index);
      }

      return acc;
    }, []);

    await Promise.all(
      diedEnemies.map((index) => new EnemyDiesAnimation(index).animate()),
    );

    dispatch({ type: 'enemiesDied', enemies: diedEnemies });

    const { enemies: aliveEnemies } = getState();

    if (aliveEnemies.length > 0) {
      for (let i = 0; i < aliveEnemies.length; i++) {
        const { name } = enemies[i];
        await getEnemy(name).act(i, getState(), dispatch);
      }

      dispatch({ type: 'startTurn' });
    } else {
      // you killed everyone
    }
  });
}
