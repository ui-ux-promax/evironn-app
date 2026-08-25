import { describe, expect, it } from 'vitest';
import { roomSchema } from '@/services/dto/room.dto';

describe('room DTO', () => {
  it('trims the room identity fields', () => {
    const result = roomSchema.safeParse({ id: ' room-1 ', name: ' Гостиная ', slug: ' living-room ', sortOrder: 4 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ id: 'room-1', name: 'Гостиная', slug: 'living-room', sortOrder: 4 });
    }
  });

  it('rejects invalid slugs, empty names, and negative ordering', () => {
    expect(roomSchema.safeParse({ name: '', slug: 'living room', sortOrder: 0 }).success).toBe(false);
    expect(roomSchema.safeParse({ name: 'Гостиная', slug: 'Living', sortOrder: 0 }).success).toBe(false);
    expect(roomSchema.safeParse({ name: 'Гостиная', slug: 'living', sortOrder: -1 }).success).toBe(false);
  });
});
