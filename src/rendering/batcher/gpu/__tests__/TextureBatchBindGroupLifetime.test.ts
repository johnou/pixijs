import { TextureSource } from '../../../renderers/shared/texture/sources/TextureSource';
import { getTextureBatchBindGroup } from '../getTextureBatchBindGroup';

describe('getTextureBatchBindGroup', () =>
{
    it('retires a cached group when one of its textures is destroyed', () =>
    {
        const oldSource = new TextureSource({ width: 1, height: 1 });
        const newSource = new TextureSource({ width: 1, height: 1 });
        const shared = new TextureSource({ width: 1, height: 1 });
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

        try
        {
            const retired = getTextureBatchBindGroup([oldSource, shared], 2, 2);
            const active = getTextureBatchBindGroup([newSource, shared], 2, 2);
            const oldKey = retired._key;

            expect(shared.listenerCount('change')).toBe(2);
            oldSource.unload();
            expect(getTextureBatchBindGroup([oldSource, shared], 2, 2)).toBe(retired);
            expect(retired._key).not.toBe(oldKey);
            oldSource.destroy();

            expect(Object.keys(retired.resources)).toHaveLength(0);
            expect(retired._key).not.toBe(oldKey);
            expect(shared.listenerCount('change')).toBe(1);
            expect(getTextureBatchBindGroup([newSource, shared], 2, 2)).toBe(active);
            expect(warn).not.toHaveBeenCalled();

            active.destroy();
            expect(shared.listenerCount('change')).toBe(0);
            expect(getTextureBatchBindGroup([newSource, shared], 2, 2)).not.toBe(active);
        }
        finally
        {
            warn.mockRestore();
            if (!oldSource.destroyed) oldSource.destroy();
            newSource.destroy();
            shared.destroy();
        }
    });
});
