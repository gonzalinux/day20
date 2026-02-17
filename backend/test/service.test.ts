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
  id: "gandalf",
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

const mockUserWithPin: User = {
  ...mockUser,
  id: "legolas",
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
    updateRoom: async () => 1,
    getUsersFromRoom: async (roomId: string) =>
      users.filter((u) => u.roomId === roomId),
    createUser: async (user: User) => {
      users.push(user);
      return user;
    },
    updateUser: async () => 1,
    setUserPin: async () => 1,
    removeUserPin: async () => 1,
    deleteUsers: async (list: User[]) => list.length,
  },
}));

const {
  createRoom,
  loginRoom,
  addUserToRoom,
  updateUserAvailability,
  selectUser,
} = await import("../domain/service");

beforeEach(() => {
  rooms = [{ ...mockRoom }];
  users = [{ ...mockUser }, { ...mockUserWithPin }];
});

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

describe("addUserToRoom", () => {
  test("adds a new user", async () => {
    const result = await addUserToRoom("test-room", {
      name: "frodo",
      roomId: "test-room",
      role: "user",
      weeklyAvailability: mockRoom.defaultAvailability,
      overrides: [],
      timezone: "America/New_York",
    });
    expect(result.id).toBe("test-room:frodo");
    expect(result.hasPin).toBe(false);
  });

  test("persists user timezone", async () => {
    const result = await addUserToRoom("test-room", {
      name: "aragorn",
      roomId: "test-room",
      role: "user",
      weeklyAvailability: mockRoom.defaultAvailability,
      overrides: [],
      timezone: "Pacific/Auckland",
    });
    expect(result.timezone).toBe("Pacific/Auckland");
  });

  test("throws on duplicate name", async () => {
    expect(
      addUserToRoom("test-room", {
        name: "gandalf",
        roomId: "test-room",
        role: "user",
        weeklyAvailability: mockRoom.defaultAvailability,
        overrides: [],
        timezone: "UTC",
      })
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

describe("updateUserAvailability", () => {
  test("updates availability for own user", async () => {
    const avail = {
      ...mockRoom.defaultAvailability,
      monday: [{ start: { hour: 10, minute: 0 }, end: { hour: 12, minute: 0 } }],
    };
    const result = await updateUserAvailability(
      "test-room",
      "gandalf",
      "gandalf",
      { weeklyAvailability: avail }
    );
    expect(result.weeklyAvailability.monday).toHaveLength(1);
  });

  test("throws when updating another user", async () => {
    expect(
      updateUserAvailability("test-room", "gandalf", "legolas", {
        weeklyAvailability: mockRoom.defaultAvailability,
      })
    ).rejects.toThrow("your own");
  });
});

describe("selectUser", () => {
  test("selects user without pin", async () => {
    const result = await selectUser("test-room", "gandalf");
    expect(result.id).toBe("gandalf");
  });

  test("selects user with correct pin", async () => {
    const result = await selectUser("test-room", "legolas", "1234");
    expect(result.id).toBe("legolas");
  });

  test("throws when pin required but not provided", async () => {
    expect(
      selectUser("test-room", "legolas")
    ).rejects.toThrow("PIN required");
  });

  test("throws on wrong pin", async () => {
    expect(
      selectUser("test-room", "legolas", "0000")
    ).rejects.toThrow("Wrong PIN");
  });

  test("throws when user not found", async () => {
    expect(
      selectUser("test-room", "nonexistent")
    ).rejects.toThrow("User not found");
  });
});
