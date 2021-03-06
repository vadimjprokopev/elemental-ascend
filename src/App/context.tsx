import React, { ReactElement, Dispatch } from 'react';
import { EnemyState } from '../resources/enemies/enemy';
import { SpellState } from '../resources/spells/spell';
import importAll, {
  getSpell,
  getEnemy,
  getEncounter,
  getStartingSpellSlots,
} from '../resources';
import { SpellSlotState } from '../resources/spell-slots/spell-slot';
import useThunkReducer, { Thunk } from 'react-hook-thunk-reducer';
import produce from 'immer';

export interface State {
  playerHealth: number;
  enemies: EnemyState[];
  spells: SpellState[];
  spellSlots: SpellSlotState[];
  currentSlot: number;
  currentSpell: number;
  playerTurn: boolean;
}
const StateContext = React.createContext<State | undefined>(undefined);

export type GameDispatch = Dispatch<Action | Thunk<State, Action>>;
export type Action =
  | ChangeSpellAction
  | EnemyAction
  | EndTurnAction
  | StartTurnAction
  | EnemyDiedAction
  | CastSpellAction;
export type ChangeSpellAction = {
  type: 'changeSpell';
  spell: number;
};
export type EnemyAction = {
  type: 'enemyAction';
  mutation: (state: State) => void;
};
export type EndTurnAction = {
  type: 'endTurn';
};
export type StartTurnAction = {
  type: 'startTurn';
};
export type EnemyDiedAction = {
  type: 'enemiesDied';
  enemies: number[];
};
export type CastSpellAction = {
  type: 'castSpell';
  mutation: (state: State) => void;
};
const DispatchContext = React.createContext<GameDispatch | undefined>(
  undefined,
);

function reducer(state: State, action: Action) {
  switch (action.type) {
    case 'changeSpell': {
      return {
        ...state,
        currentSpell: action.spell,
      };
    }
    case 'enemyAction': {
      return produce(state, action.mutation);
    }
    case 'endTurn': {
      return {
        ...state,
        playerTurn: false,
      };
    }
    case 'startTurn': {
      const { spellSlots, currentSlot } = state;
      return {
        ...state,
        playerTurn: true,
        currentSlot:
          currentSlot === spellSlots.length - 1 ? 0 : currentSlot + 1,
      };
    }
    case 'enemiesDied': {
      return {
        ...state,
        enemies: state.enemies.filter(
          (_, index) => !action.enemies.includes(index),
        ),
      };
    }
    case 'castSpell': {
      return produce(state, action.mutation);
    }
  }
}

export function Provider({
  children,
}: {
  children: React.ReactNode;
}): ReactElement {
  importAll();
  const [state, dispatch] = useThunkReducer(reducer, {
    playerHealth: 100,
    enemies: getEncounter(0).enemies.map((e) => getEnemy(e).startingState),
    spells: [
      getSpell('Fireball').startingState,
      getSpell('Lightning strike').startingState,
      getSpell('Shadow bolt').startingState,
    ],
    spellSlots: getStartingSpellSlots(),
    currentSlot: 0,
    currentSpell: 0,
    playerTurn: true,
  });

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

export function useState(): State {
  const context = React.useContext(StateContext);
  if (context === undefined) {
    throw new Error('useState must be used within a CountProvider');
  }
  return context;
}
export function useDispatch(): GameDispatch {
  const context = React.useContext(DispatchContext);
  if (context === undefined) {
    throw new Error('useDispatch must be used within a CountProvider');
  }
  return context;
}
