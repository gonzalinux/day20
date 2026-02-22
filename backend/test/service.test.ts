import { describe, test, expect, mock, beforeEach } from "bun:test";
import type { Room } from "../repository/room";
import type { User } from "../repository/user";

const mockRoom: Room = {
  id: "test-room",
  name: "test-room",
  description: "A test room",
  password: await Bun.password.hash("password123"),
  magicToken: "test-token-abc",
  duration: { min: 1, max: 4 },
  defaultAvailability: {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  timezone: "Europe/Madrid",
};

const mockUser: User = {
  id: "test-room:gandalf",
  roomId: "test-room",
  name: "gandalf",
  role: "admin",
  weeklyAvailability: {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  },
  overrides: [],
  timezone: "America/New_York",
};

const mockRegularUser: User = {
  ...mockUser,
  id: "test-room:frodo",
  name: "frodo",
  role: "user",
};

const mockUserWithPin: User = {
  ...mockUser,
  id: "test-room:legolas",
  name: "legolas",
  pin: await Bun.password.hash("1234"),
};

let rooms: Room[] = [];
let users: User[] = [];

mock.module("../repository/repository", () => ({
  default: {
    findRoom: async (id: string) => rooms.find((r) => r.id === id) ?? null,
    insertRoom: async (room: Room) => {
      rooms.push(room);
      return room.id;
    },
    updateRoom: async (updates: Partial<Room> & { id: string }) => {
      const idx = rooms.findIndex((r) => r.id === updates.id);
      if (idx !== -1) rooms[idx] = { ...rooms[idx]!, ...updates };
      return idx !== -1 ? 1 : 0;
    },
    deleteRoom: async (id: string) => {
      const before = rooms.length + users.length;
      users = users.filter((u) => u.roomId !== id);
      rooms = rooms.filter((r) => r.id !== id);
      return before - rooms.length - users.length;
    },
    getUsersFromRoom: async (roomId: string) =>
      users.filter((u) => u.roomId === roomId),
    createUser: async (user: User) => {
      users.push(user);
      return user;
    },
    updateUser: async (updates: Partial<User> & { id: string }) => {
      const idx = users.findIndex((u) => u.id === updates.id);
      if (idx !== -1) users[idx] = { ...users[idx]!, ...updates };
      return idx !== -1 ? 1 : 0;
    },
    setUserPin: async (_roomId: string, userId: string, hashedPin: string) => {
      const idx = users.findIndex((u) => u.id === userId);
      if (idx !== -1) users[idx]!.pin = hashedPin;
      return idx !== -1 ? 1 : 0;
    },
    skipUserPin: async (_roomId: string, userId: string) => {
      const idx = users.findIndex((u) => u.id === userId);
      if (idx !== -1) {
        delete users[idx]!.pin;
        users[idx]!.pinSkipped = true;
      }
      return idx !== -1 ? 1 : 0;
    },
    removeUserPin: async (_roomId: string, userId: string) => {
      const idx = users.findIndex((u) => u.id === userId);
      if (idx !== -1) {
        delete users[idx]!.pin;
        users[idx]!.pinSkipped = false;
      }
      return idx !== -1 ? 1 : 0;
    },
    deleteUsers: async (list: User[]) => {
      const ids = list.map((u) => u.id);
      const before = users.length;
      users = users.filter((u) => !ids.includes(u.id));
      return before - users.length;
    },
    findStaleRooms: async () => [],
  },
}));

const {
  createRoom,
  loginRoom,
  getRoom,
  getUsersFromRoom,
  roomExists,
  addUserToRoom,
  updateRoom,
  deleteRoom,
  updateUserAvailability,
  removeUsersFromRoom,
  selectUser,
  setUserPin,
  removeUserPin,
} = await import("../domain/service");

beforeEach(() => {
  rooms = [{ ...mockRoom }];
  users = [{ ...mockUser }, { ...mockRegularUser }, { ...mockUserWithPin }];
});

// ===== createRoom =====

describe("createRoom", () => {
  test("creates a room and returns id + magicToken", async () => {
    rooms = [];
    const result = await createRoom({
      name: "new-room",
      description: "desc",
      password: "pass",
      duration: { min: 1, max: 4 },
      defaultAvailability: mockRoom.defaultAvailability,
      timezone: "Europe/Madrid",
    });
    expect(result.id).toBe("new-room");
    expect(result.magicToken).toBeString();
    expect(result.magicToken.length).toBeGreaterThan(10);
  });

  test("persists timezone field", async () => {
    rooms = [];
    await createRoom({
      name: "tz-room",
      description: "desc",
      password: "pass",
      duration: { min: 1, max: 4 },
      defaultAvailability: mockRoom.defaultAvailability,
      timezone: "Asia/Tokyo",
    });
    expect(rooms[0]!.timezone).toBe("Asia/Tokyo");
  });
});

// ===== loginRoom =====

describe("loginRoom", () => {
  test("succeeds with correct password", async () => {
    const result = await loginRoom("test-room", { password: "password123" });
    expect(result.room.id).toBe("test-room");
    expect(result.users).toBeArray();
  });

  test("succeeds with correct token", async () => {
    const result = await loginRoom("test-room", { token: "test-token-abc" });
    expect(result.room.id).toBe("test-room");
  });

  test("does not return password field", async () => {
    const result = await loginRoom("test-room", { password: "password123" });
    expect(result.room).not.toHaveProperty("password");
  });

  test("throws on invalid password", async () => {
    expect(
      loginRoom("test-room", { password: "wrong" })
    ).rejects.toThrow("Invalid password");
  });

  test("throws on invalid token", async () => {
    expect(
      loginRoom("test-room", { token: "wrong" })
    ).rejects.toThrow("Invalid token");
  });

  test("throws when no credentials provided", async () => {
    expect(loginRoom("test-room", {})).rejects.toThrow(
      "Password or token required"
    );
  });

  test("throws when room not found", async () => {
    expect(
      loginRoom("nonexistent", { password: "pass" })
    ).rejects.toThrow("Room not found");
  });
});

// ===== roomExists =====

describe("roomExists", () => {
  test("returns true for existing room", async () => {
    expect(await roomExists("test-room")).toBe(true);
  });

  test("returns false for missing room", async () => {
    expect(await roomExists("ghost-room")).toBe(false);
  });
});

// ===== getRoom =====

describe("getRoom", () => {
  test("returns room and users", async () => {
    const result = await getRoom("test-room");
    expect(result.room.id).toBe("test-room");
    expect(result.users).toBeArray();
  });

  test("does not return password field", async () => {
    const result = await getRoom("test-room");
    expect(result.room).not.toHaveProperty("password");
  });

  test("throws when room not found", async () => {
    expect(getRoom("nonexistent")).rejects.toThrow("Room not found");
  });
});

// ===== getUsersFromRoom =====

describe("getUsersFromRoom", () => {
  test("returns users for a room", async () => {
    const result = await getUsersFromRoom("test-room");
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((u) => u.roomId === "test-room")).toBe(true);
  });

  test("strips pin from returned users", async () => {
    const result = await getUsersFromRoom("test-room");
    expect(result.every((u) => !("pin" in u))).toBe(true);
  });

  test("throws when room not found", async () => {
    expect(getUsersFromRoom("nonexistent")).rejects.toThrow("Room not found");
  });
});

// ===== updateRoom =====

describe("updateRoom", () => {
  test("updates room description as admin", async () => {
    await updateRoom({ id: "test-room", description: "updated" }, "test-room:gandalf");
    expect(rooms[0]!.description).toBe("updated");
  });

  test("throws when no user selected", async () => {
    expect(
      updateRoom({ id: "test-room", description: "x" }, "")
    ).rejects.toThrow("Must select a user first");
  });

  test("throws when non-admin tries to update", async () => {
    expect(
      updateRoom({ id: "test-room", description: "x" }, "test-room:frodo")
    ).rejects.toThrow();
  });

  test("throws when room not found", async () => {
    expect(
      updateRoom({ id: "nonexistent", description: "x" }, "test-room:gandalf")
    ).rejects.toThrow("Room not found");
  });
});

// ===== deleteRoom =====

describe("deleteRoom", () => {
  test("deletes room as admin", async () => {
    await deleteRoom("test-room", "test-room:gandalf");
    expect(rooms.find((r) => r.id === "test-room")).toBeUndefined();
  });

  test("throws when non-admin tries to delete", async () => {
    expect(
      deleteRoom("test-room", "test-room:frodo")
    ).rejects.toThrow();
  });

  test("throws when room not found", async () => {
    expect(
      deleteRoom("nonexistent", "test-room:gandalf")
    ).rejects.toThrow("Room not found");
  });
});

// ===== addUserToRoom =====

describe("addUserToRoom", () => {
  test("adds first user to empty room without auth", async () => {
    users = [];
    const result = await addUserToRoom("test-room", {
      name: "aragorn",
      roomId: "test-room",
      role: "admin",
      weeklyAvailability: mockRoom.defaultAvailability,
      overrides: [],
      timezone: "UTC",
    });
    expect(result.id).toBe("test-room:aragorn");
  });

  test("adds user as admin when room already has users", async () => {
    const result = await addUserToRoom(
      "test-room",
      {
        name: "pippin",
        roomId: "test-room",
        role: "user",
        weeklyAvailability: mockRoom.defaultAvailability,
        overrides: [],
        timezone: "UTC",
      },
      "test-room:gandalf",
    );
    expect(result.id).toBe("test-room:pippin");
    expect(result.hasPin).toBe(false);
  });

  test("persists user timezone", async () => {
    const result = await addUserToRoom(
      "test-room",
      {
        name: "aragorn",
        roomId: "test-room",
        role: "user",
        weeklyAvailability: mockRoom.defaultAvailability,
        overrides: [],
        timezone: "Pacific/Auckland",
      },
      "test-room:gandalf",
    );
    expect(result.timezone).toBe("Pacific/Auckland");
  });

  test("throws when no user selected and room has users", async () => {
    expect(
      addUserToRoom("test-room", {
        name: "pippin",
        roomId: "test-room",
        role: "user",
        weeklyAvailability: mockRoom.defaultAvailability,
        overrides: [],
        timezone: "UTC",
      })
    ).rejects.toThrow("Must select a user first");
  });

  test("throws when non-admin tries to add user", async () => {
    expect(
      addUserToRoom(
        "test-room",
        {
          name: "pippin",
          roomId: "test-room",
          role: "user",
          weeklyAvailability: mockRoom.defaultAvailability,
          overrides: [],
          timezone: "UTC",
        },
        "test-room:frodo",
      )
    ).rejects.toThrow();
  });

  test("throws on duplicate name", async () => {
    expect(
      addUserToRoom(
        "test-room",
        {
          name: "gandalf",
          roomId: "test-room",
          role: "user",
          weeklyAvailability: mockRoom.defaultAvailability,
          overrides: [],
          timezone: "UTC",
        },
        "test-room:gandalf",
      )
    ).rejects.toThrow("already exists");
  });

  test("throws when room not found", async () => {
    expect(
      addUserToRoom("nonexistent", {
        name: "frodo",
        roomId: "nonexistent",
        role: "user",
        weeklyAvailability: mockRoom.defaultAvailability,
        overrides: [],
        timezone: "UTC",
      })
    ).rejects.toThrow("Room not found");
  });
});

// ===== removeUsersFromRoom =====

describe("removeUsersFromRoom", () => {
  test("removes users as admin", async () => {
    const count = await removeUsersFromRoom(
      "test-room",
      ["test-room:frodo"],
      "test-room:gandalf",
    );
    expect(count).toBe(1);
    expect(users.find((u) => u.id === "test-room:frodo")).toBeUndefined();
  });

  test("throws when no user selected", async () => {
    expect(
      removeUsersFromRoom("test-room", ["test-room:frodo"], "")
    ).rejects.toThrow("Must select a user first");
  });

  test("throws when non-admin tries to remove", async () => {
    expect(
      removeUsersFromRoom("test-room", ["test-room:gandalf"], "test-room:frodo")
    ).rejects.toThrow();
  });

  test("throws when no matching users found", async () => {
    expect(
      removeUsersFromRoom("test-room", ["test-room:nobody"], "test-room:gandalf")
    ).rejects.toThrow("No matching users found");
  });

  test("throws when room not found", async () => {
    expect(
      removeUsersFromRoom("nonexistent", ["x"], "test-room:gandalf")
    ).rejects.toThrow("Room not found");
  });
});

// ===== updateUserAvailability =====

describe("updateUserAvailability", () => {
  test("updates availability for own user", async () => {
    const avail = {
      ...mockRoom.defaultAvailability,
      monday: [{ start: { hour: 10, minute: 0 }, end: { hour: 12, minute: 0 } }],
    };
    const result = await updateUserAvailability(
      "test-room",
      "test-room:gandalf",
      "test-room:gandalf",
      { weeklyAvailability: avail }
    );
    expect(result.weeklyAvailability.monday).toHaveLength(1);
  });

  test("throws when updating another user", async () => {
    expect(
      updateUserAvailability("test-room", "test-room:gandalf", "test-room:frodo", {
        weeklyAvailability: mockRoom.defaultAvailability,
      })
    ).rejects.toThrow("your own");
  });
});

// ===== selectUser =====

describe("selectUser", () => {
  test("selects user without pin", async () => {
    const result = await selectUser("test-room", "test-room:gandalf");
    expect(result.id).toBe("test-room:gandalf");
  });

  test("selects user with correct pin", async () => {
    const result = await selectUser("test-room", "test-room:legolas", "1234");
    expect(result.id).toBe("test-room:legolas");
  });

  test("throws when pin required but not provided", async () => {
    expect(
      selectUser("test-room", "test-room:legolas")
    ).rejects.toThrow("PIN required");
  });

  test("throws on wrong pin", async () => {
    expect(
      selectUser("test-room", "test-room:legolas", "0000")
    ).rejects.toThrow("Wrong PIN");
  });

  test("throws when user not found", async () => {
    expect(
      selectUser("test-room", "test-room:nonexistent")
    ).rejects.toThrow("User not found");
  });
});

// ===== setUserPin =====

describe("setUserPin", () => {
  test("sets pin on own user", async () => {
    await setUserPin("test-room", "test-room:gandalf", "test-room:gandalf", "5678");
    const user = users.find((u) => u.id === "test-room:gandalf");
    expect(user?.pin).toBeString();
    const valid = await Bun.password.verify("5678", user!.pin!);
    expect(valid).toBe(true);
  });

  test("skips pin when empty string provided", async () => {
    await setUserPin("test-room", "test-room:gandalf", "test-room:gandalf", "");
    const user = users.find((u) => u.id === "test-room:gandalf");
    expect(user?.pinSkipped).toBe(true);
    expect(user?.pin).toBeUndefined();
  });

  test("throws when setting another user's pin", async () => {
    expect(
      setUserPin("test-room", "test-room:gandalf", "test-room:frodo", "1234")
    ).rejects.toThrow("your own PIN");
  });

  test("throws when user not found", async () => {
    expect(
      setUserPin("test-room", "test-room:nobody", "test-room:nobody", "1234")
    ).rejects.toThrow("User not found");
  });
});

// ===== removeUserPin =====

describe("removeUserPin", () => {
  test("admin removes another user's pin", async () => {
    await removeUserPin("test-room", "test-room:gandalf", "test-room:legolas");
    const user = users.find((u) => u.id === "test-room:legolas");
    expect(user?.pin).toBeUndefined();
    expect(user?.pinSkipped).toBe(false);
  });

  test("throws when non-admin tries to remove pin", async () => {
    expect(
      removeUserPin("test-room", "test-room:frodo", "test-room:legolas")
    ).rejects.toThrow("Only admins");
  });

  test("throws when target user not found", async () => {
    expect(
      removeUserPin("test-room", "test-room:gandalf", "test-room:nobody")
    ).rejects.toThrow("User not found");
  });

  test("throws when auth user not found", async () => {
    expect(
      removeUserPin("test-room", "test-room:nobody", "test-room:legolas")
    ).rejects.toThrow("Auth user not found");
  });
});
