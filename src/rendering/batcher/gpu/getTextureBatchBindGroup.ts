import { BindGroup } from '../../renderers/gpu/shader/BindGroup';
import { Texture } from '../../renderers/shared/texture/Texture';

import type { BindResource } from '../../renderers/gpu/shader/BindResource';
import type { TextureSource } from '../../renderers/shared/texture/sources/TextureSource';

const cachedGroups: Record<number, BindGroup> = {};

class TextureBatchBindGroup extends BindGroup
{
    constructor(resources: Record<string, BindResource>, private readonly _cacheKey: number)
    {
        super(resources);
    }

    protected override onResourceChange(resource: BindResource)
    {
        if (resource.destroyed) this.destroy();
        else super.onResourceChange(resource);
    }

    /**
     * Remove this batch from the cache and release its resource listeners.
     * @advanced
     */
    public override destroy()
    {
        if (cachedGroups[this._cacheKey] === this) delete cachedGroups[this._cacheKey];

        super.destroy();
        this.resources = Object.create(null);
        this._dirty = true;
    }
}

/**
 * @param textures
 * @param size
 * @param maxTextures
 * @internal
 */
export function getTextureBatchBindGroup(textures: TextureSource[], size: number, maxTextures: number)
{
    let uid = 2166136261; // FNV-1a 32-bit offset basis

    for (let i = 0; i < size; i++)
    {
        uid ^= textures[i].uid;
        uid = Math.imul(uid, 16777619);
        uid >>>= 0;
    }

    return cachedGroups[uid] || generateTextureBatchBindGroup(textures, size, uid, maxTextures);
}

function generateTextureBatchBindGroup(textures: TextureSource[], size: number, key: number, maxTextures: number): BindGroup
{
    const bindGroupResources: Record<string, any> = {};

    let bindIndex = 0;

    for (let i = 0; i < maxTextures; i++)
    {
        const texture = i < size ? textures[i] : Texture.EMPTY.source;

        bindGroupResources[bindIndex++] = texture.source;
        bindGroupResources[bindIndex++] = texture.style;
    }

    // pad out with empty textures
    const bindGroup = new TextureBatchBindGroup(bindGroupResources, key);

    cachedGroups[key] = bindGroup;

    return bindGroup;
}
