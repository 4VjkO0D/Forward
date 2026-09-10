import { useEffect, useState } from 'react';
import { PALETTE } from '../store/reducer';
import { useStore } from '../store/StoreContext';
import { Modal } from './Modal';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function NewCategoryModal({ open, onClose }: Props) {
  const { dispatch } = useStore();
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(PALETTE[0]);

  useEffect(() => {
    if (open) {
      setName('');
      setColor(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
    }
  }, [open]);

  const create = () => {
    dispatch({ type: 'addCategory', name: name.trim() || 'New page', color });
    onClose();
  };

  return (
    <Modal open={open} title="New page" onClose={onClose}>
      <label className="field">
        <span>Which area of life is this?</span>
        <input
          className="input"
          value={name}
          placeholder="Health, School, Money…"
          autoFocus
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              create();
            }
          }}
        />
      </label>

      <div className="field">
        <span>Colour</span>
        <div className="swatches">
          {PALETTE.map((swatch) => (
            <button
              key={swatch}
              type="button"
              className={swatch === color ? 'swatch active' : 'swatch'}
              style={{ background: swatch }}
              aria-label={`Use colour ${swatch}`}
              onClick={() => setColor(swatch)}
            />
          ))}
        </div>
      </div>

      <div className="modal-actions">
        <button type="button" className="btn" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" onClick={create}>
          Create page
        </button>
      </div>
    </Modal>
  );
}
