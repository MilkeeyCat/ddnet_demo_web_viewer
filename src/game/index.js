import { Reader } from '../reader';
import { Uuid } from '../uuid';

const textDecoder = new TextDecoder();

const SV_MOTD = 1;
const SV_BROADCAST = 2;
const SV_CHAT = 3;
const SV_KILL_MSG = 4;
const SV_SOUND_GLOBAL = 5;
const SV_TUNE_PARAMS = 6;
const SV_EXTRA_PROJECTILE = 7;
const SV_READY_TO_ENTER = 8;
const SV_WEAPON_PICKUP = 9;
const SV_EMOTICON = 10;
const SV_VOTE_CLEAR_OPTIONS = 11;
const SV_VOTE_OPTION_LIST_ADD = 12;
const SV_VOTE_OPTION_ADD = 13;
const SV_VOTE_OPTION_REMOVE = 14;
const SV_VOTE_SET = 15;
const SV_VOTE_STATUS = 16;
const CL_SAY = 17;
const CL_SET_TEAM = 18;
const CL_SET_SPECTATOR_MODE = 19;
const CL_START_INFO = 20;
const CL_CHANGE_INFO = 21;
const CL_KILL = 22;
const CL_EMOTICON = 23;
const CL_VOTE = 24;
const CL_CALL_VOTE = 25;
const CL_IS_DDNET_LEGACY = 26;
const SV_DDRACE_TIME_LEGACY = 27;
const SV_RECORD_LEGACY = 28;
const UNUSED = 29;
const SV_TEAMS_STATE_LEGACY = 30;
const CL_SHOW_OTHERS_LEGACY = 31;

const SV_MY_OWN_MESSAGE = Uuid.fromU32([
    0x1231e484, 0xf6073722, 0xa89abd85, 0xdb46f5d2,
]);
const CL_SHOW_DISTANCE = Uuid.fromU32([
    0x53bb28af, 0x42523ac9, 0x8fd36ccb, 0xc2a603e3,
]);
const CL_SHOW_OTHERS = Uuid.fromU32([
    0x7f264cdd, 0x71a23962, 0xbbce0f94, 0xbbd81913,
]);
const SV_TEAMS_STATE = Uuid.fromU32([
    0xa091961a, 0x95e83744, 0xbb605eac, 0x9bd563c6,
]);
const SV_DDRACE_TIME = Uuid.fromU32([
    0x5dde8b3c, 0x6f6f37ac, 0xa72abb34, 0x1fe76de5,
]);
const SV_RECORD = Uuid.fromU32([
    0x804f149f, 0x9b533b0a, 0x897f5966, 0x3a1c4eb9,
]);

class SystemOrGame {
    /**
     * @param {Reader} data
        * @returns {[0 | 1, Uuid | number]}
     */
    static decode_id(data) {
        const id = data.readInt();
        const sys = (id & 1) != 0;
        /** @type {number | Uuid} */
        let msg = id >> 1;

        if (msg == 0) {
            msg = data.readUuid();
        }

        if (sys) {
            return [1, msg];
        } else {
            return [0, msg];
        }
    }
}

class SvModt {
    /** @param {string} message */
    constructor(message) {
        this.message = message;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new SvModt(textDecoder.decode(unpacker.readString()));
    }
}

class SvBroadcast {
    /** @param {string} message */
    constructor(message) {
        this.message = message;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new SvBroadcast(textDecoder.decode(unpacker.readString()));
    }
}

class SvChat {
    /**
     * @param {boolean} team
     * @param {number} clientId
     * @param {string} message
     */
    constructor(
        team,
        clientId,
        message,
    ) {
        /** @type {boolean} */
        this.team = team;
        /** @type {number} */
        this.clientId = clientId;
        /** @type {string} */
        this.message = message;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new SvChat(
            unpacker.readInt() == 1,
            unpacker.readInt(),
            textDecoder.decode(unpacker.readString()),
        );
    }
}

class SvKillMsg {
    /**
     * @param {number} killer
     * @param {number} victim
     * @param {number} weapon
     * @param {number} modeSpecial
     */
    constructor(
        killer,
        victim,
        weapon,
        modeSpecial,
    ) {
        /** @type {number} */
        this.killer = killer;
        /** @type {number} */
        this.victim = victim;
        /** @type {number} */
        this.weapon = weapon;
        /** @type {number} */
        this.modeSpecial = modeSpecial;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new SvKillMsg(
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
        );
    }
}

const Sound = {
    GunFire: 0,
    ShotgunFire: 1,
    GrenadeFire: 2,
    HammerFire: 3,
    HammerHit: 4,
    NinjaFire: 5,
    GrenadeExplode: 6,
    NinjaHit: 7,
    RifleFire: 8,
    RifleBounce: 9,
    WeaponSwitch: 10,
    PlayerPainShort: 11,
    PlayerPainLong: 12,
    BodyLand: 13,
    PlayerAirjump: 14,
    PlayerJump: 15,
    PlayerDie: 16,
    PlayerSpawn: 17,
    PlayerSkid: 18,
    TeeCry: 19,
    HookLoop: 20,
    HookAttachGround: 21,
    HookAttachPlayer: 22,
    HookNoattach: 23,
    PickupHealth: 24,
    PickupArmor: 25,
    PickupGrenade: 26,
    PickupShotgun: 27,
    PickupNinja: 28,
    WeaponSpawn: 29,
    WeaponNoammo: 30,
    Hit: 31,
    ChatServer: 32,
    ChatClient: 33,
    CtfDrop: 34,
    CtfReturn: 35,
    CtfGrabPl: 36,
    CtfGrabEn: 37,
    CtfCapture: 38,
};

class SvSoundGlobal {
    /** @param {number} soundId */
    constructor(soundId) {
        /** @type {number} */
        this.soundId = soundId;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new SvSoundGlobal(unpacker.readInt());
    }
}

class SvTuneParams {
    /**
     * @param {number} groundControlSpeed
     * @param {number} groundControlAccel
     * @param {number} groundFriction
     * @param {number} groundJumpImpulse
     * @param {number} airJumpImpulse
     * @param {number} airControlSpeed
     * @param {number} airControlAccel
     * @param {number} airFriction
     * @param {number} hookLength
     * @param {number} hookFireSpeed
     * @param {number} hookDragAccel
     * @param {number} hookDragSpeed
     * @param {number} gravity
     * @param {number} velrampStart
     * @param {number} velrampRange
     * @param {number} velrampCurvature
     * @param {number} gunCurvature
     * @param {number} gunSpeed
     * @param {number} gunLifetime
     * @param {number} shotgunCurvature
     * @param {number} shotgunSpeed
     * @param {number} shotgunSpeeddiff
     * @param {number} shotgunLifetime
     * @param {number} grenadeCurvature
     * @param {number} grenadeSpeed
     * @param {number} grenadeLifetime
     * @param {number} laserReach
     * @param {number} laserBounceDelay
     * @param {number} laserBounceNum
     * @param {number} laserBounceCost
     * @param {number} laserDamage
     * @param {number} playerCollision
     * @param {number} playerHooking
     */
    constructor(
        groundControlSpeed,
        groundControlAccel,
        groundFriction,
        groundJumpImpulse,
        airJumpImpulse,
        airControlSpeed,
        airControlAccel,
        airFriction,
        hookLength,
        hookFireSpeed,
        hookDragAccel,
        hookDragSpeed,
        gravity,
        velrampStart,
        velrampRange,
        velrampCurvature,
        gunCurvature,
        gunSpeed,
        gunLifetime,
        shotgunCurvature,
        shotgunSpeed,
        shotgunSpeeddiff,
        shotgunLifetime,
        grenadeCurvature,
        grenadeSpeed,
        grenadeLifetime,
        laserReach,
        laserBounceDelay,
        laserBounceNum,
        laserBounceCost,
        laserDamage,
        playerCollision,
        playerHooking,
    ) {
        this.groundControlSpeed = groundControlSpeed;
        this.groundControlAccel = groundControlAccel;
        this.groundFriction = groundFriction;
        this.groundJumpImpulse = groundJumpImpulse;
        this.airJumpImpulse = airJumpImpulse;
        this.airControlSpeed = airControlSpeed;
        this.airControlAccel = airControlAccel;
        this.airFriction = airFriction;
        this.hookLength = hookLength;
        this.hookFireSpeed = hookFireSpeed;
        this.hookDragAccel = hookDragAccel;
        this.hookDragSpeed = hookDragSpeed;
        this.gravity = gravity;
        this.velrampStart = velrampStart;
        this.velrampRange = velrampRange;
        this.velrampCurvature = velrampCurvature;
        this.gunCurvature = gunCurvature;
        this.gunSpeed = gunSpeed;
        this.gunLifetime = gunLifetime;
        this.shotgunCurvature = shotgunCurvature;
        this.shotgunSpeed = shotgunSpeed;
        this.shotgunSpeeddiff = shotgunSpeeddiff;
        this.shotgunLifetime = shotgunLifetime;
        this.grenadeCurvature = grenadeCurvature;
        this.grenadeSpeed = grenadeSpeed;
        this.grenadeLifetime = grenadeLifetime;
        this.laserReach = laserReach;
        this.laserBounceDelay = laserBounceDelay;
        this.laserBounceNum = laserBounceNum;
        this.laserBounceCost = laserBounceCost;
        this.laserDamage = laserDamage;
        this.playerCollision = playerCollision;
        this.playerHooking = playerHooking;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new SvTuneParams(
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
        );
    }
}

const Weapon = {
    Hammer: 0,
    Pistol: 1,
    Shotgun: 2,
    Grenade: 3,
    Rifle: 4,
    Ninja: 5,
}

/**
 * @typedef {Object} Projectile
 * @property {number} x
 * @property {number} y
 * @property {number} velX
 * @property {number} velY
 * @property {number} type
 * @property {number} startTick
 */

class SvExtraProjectile {
    /** @param {Projectile} projectile */
    constructor(projectile) {
        this.projectile = projectile;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new SvExtraProjectile({
            x: unpacker.readInt(),
            y: unpacker.readInt(),
            velX: unpacker.readInt(),
            velY: unpacker.readInt(),
            type: unpacker.readInt(),
            startTick: unpacker.readInt(),
        });
    }
}

class SvReadyToEnter {
    /** @param {Reader} _ */
    static decode(_) {
        return new SvReadyToEnter();
    }
}

class SvWeaponPickup {
    /** @param {number} weapon */
    constructor(weapon) {
        /** @type {number} */
        this.weapon = weapon;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new SvWeaponPickup(unpacker.readInt());
    }
}

/**
 * @enum {number}
 * @readonly
 */
const Emoticon = {
    V1: 0,
    V2: 1,
    V3: 2,
    V4: 3,
    V5: 4,
    V6: 5,
    V7: 6,
    V8: 7,
    V9: 8,
    V10: 9,
    V11: 10,
    V12: 11,
    V13: 12,
    V14: 13,
    V15: 14,
}

class SvEmotion {
    /**
     * @param {number} clientId
     * @param {number} emoticon
     */
    constructor(
        clientId,
        emoticon,
    ) {
        /** @type {number} */
        this.clientId = clientId;
        /** @type {number} */
        this.emoticon = emoticon;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new SvEmotion(unpacker.readInt(), unpacker.readInt());
    }
}

class SvVoteClearOptions {
    /** @param {Reader} _ */
    static decode(_) {
        return new SvVoteClearOptions();
    }
}

class SvVoteOptionListAdd {
    /**
     * @param {number} numOptions
     * @param {string[]} description
     */
    constructor(
        numOptions,
        description,
    ) {
        /** @type {number} */
        this.numOptions = numOptions;
        /** @type {string[]} */
        this.description = description;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new SvVoteOptionListAdd(unpacker.readInt(), [
            textDecoder.decode(unpacker.readString()),
            textDecoder.decode(unpacker.readString()),
            textDecoder.decode(unpacker.readString()),
            textDecoder.decode(unpacker.readString()),
            textDecoder.decode(unpacker.readString()),
            textDecoder.decode(unpacker.readString()),
            textDecoder.decode(unpacker.readString()),
            textDecoder.decode(unpacker.readString()),
            textDecoder.decode(unpacker.readString()),
            textDecoder.decode(unpacker.readString()),
            textDecoder.decode(unpacker.readString()),
            textDecoder.decode(unpacker.readString()),
            textDecoder.decode(unpacker.readString()),
            textDecoder.decode(unpacker.readString()),
            textDecoder.decode(unpacker.readString()),
        ]);
    }
}

class SvVoteOptionAdd {
    /** @param {string} description */
    constructor(description) {
        /** @type {string} */
        this.description = description;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new SvVoteOptionAdd(textDecoder.decode(unpacker.readString()));
    }
}

class SvVoteOptionRemove {
    /** @param {string} description */
    constructor(description) {
        /** @type {string} */
        this.description = description;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new SvVoteOptionRemove(
            textDecoder.decode(unpacker.readString()),
        );
    }
}

class SvVoteSet {
    /**
     * @param {number} timeout
     * @param {string} description
     * @param {string} reason
     */
    constructor(
        timeout,
        description,
        reason,
    ) {
        /** @type {number} */
        this.timeout = timeout;
        /** @type {string} */
        this.description = description;
        /** @type {string} */
        this.reason = reason;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new SvVoteSet(
            unpacker.readInt(),
            textDecoder.decode(unpacker.readString()),
            textDecoder.decode(unpacker.readString()),
        );
    }
}

class SvVoteStatus {
    /**
     * @param {number} yes
     * @param {number} no
     * @param {number} pass
     * @param {number} total
     */
    constructor(
        yes,
        no,
        pass,
        total,
    ) {
        /** @type {number} */
        this.yes = yes;
        /** @type {number} */
        this.no = no;
        /** @type {number} */
        this.pass = pass;
        /** @type {number} */
        this.total = total;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new SvVoteStatus(
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
        );
    }
}

class ClSay {
    /**
     * @param {boolean} team
     * @param {string} message
     */
    constructor(
        team,
        message,
    ) {
        /** @type {boolean} */
        this.team = team;
        /** @type {string} */
        this.message = message;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new ClSay(
            unpacker.readInt() == 1,
            textDecoder.decode(unpacker.readString()),
        );
    }
}

const Team = {
    Spectators: -1,
    Red: 0,
    Blue: 1,
};

class ClSetTeam {
    /** @param {number} team */
    constructor(team) {
        /** @type {number} */
        this.team = team;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new ClSetTeam(unpacker.readInt());
    }
}

class ClSetSpectatorMode {
    /** @param {number} spectatorId */
    constructor(spectatorId) {
        this.spectatorId = spectatorId;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new ClSetSpectatorMode(unpacker.readInt());
    }
}

class ClStartInfo {
    /**
     * @param {string} name
     * @param {string} clan
     * @param {number} country
     * @param {string} skin
     * @param {boolean} useCustomColor
     * @param {number} colorBody
     * @param {number} colorFeet
     */
    constructor(
        name,
        clan,
        country,
        skin,
        useCustomColor,
        colorBody,
        colorFeet,
    ) {
        /** @type {string} */
        this.name = name;
        /** @type {string} */
        this.clan = clan;
        /** @type {number} */
        this.country = country;
        /** @type {string} */
        this.skin = skin;
        /** @type {boolean} */
        this.useCustomColor = useCustomColor;
        /** @type {number} */
        this.colorBody = colorBody;
        /** @type {number} */
        this.colorFeet = colorFeet;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new ClStartInfo(
            textDecoder.decode(unpacker.readString()),
            textDecoder.decode(unpacker.readString()),
            unpacker.readInt(),
            textDecoder.decode(unpacker.readString()),
            unpacker.readInt() == 1,
            unpacker.readInt(),
            unpacker.readInt(),
        );
    }
}

class ClChangeInfo {
    /**
     * @param {string} name
     * @param {string} clan
     * @param {number} country
     * @param {string} skin
     * @param {boolean} useCustomColor
     * @param {number} colorBody
     * @param {number} colorFeet
     */
    constructor(
        name,
        clan,
        country,
        skin,
        useCustomColor,
        colorBody,
        colorFeet,
    ) {
        /** @type {string} */
        this.name = name;
        /** @type {string} */
        this.clan = clan;
        /** @type {number} */
        this.country = country;
        /** @type {string} */
        this.skin = skin;
        /** @type {boolean} */
        this.useCustomColor = useCustomColor;
        /** @type {number} */
        this.colorBody = colorBody;
        /** @type {number} */
        this.colorFeet = colorFeet;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new ClChangeInfo(
            textDecoder.decode(unpacker.readString()),
            textDecoder.decode(unpacker.readString()),
            unpacker.readInt(),
            textDecoder.decode(unpacker.readString()),
            unpacker.readInt() == 1,
            unpacker.readInt(),
            unpacker.readInt(),
        );
    }
}

class ClKill {
    /** @param {Reader} _ */
    static decode(_) { }
}

class ClEmoticon {
    /** @param {Emoticon} emoticon */
    constructor(emoticon) {
        /** @type {Emoticon} */
        this.emoticon = emoticon;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new ClEmoticon(unpacker.readInt());
    }
}

class ClVote {
    /** @param {number} vote */
    constructor(vote) {
        /** @type {number} */
        this.vote = vote;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new ClVote(unpacker.readInt());
    }
}

class ClCallVote {
    /**
     * @param {string} type
     * @param {string} value
     * @param {string} reason
     */
    constructor(
        type,
        value,
        reason,
    ) {
        /** @type {string} */
        this.type = type;
        /** @type {string} */
        this.value = value;
        /** @type {string} */
        this.reason = reason;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new ClCallVote(
            textDecoder.decode(unpacker.readString()),
            textDecoder.decode(unpacker.readString()),
            textDecoder.decode(unpacker.readString()),
        );
    }
}

class ClIsDdnetLegacy {
    /** @param {number} ddnetVersion */
    constructor(ddnetVersion) {
        this.ddnetVersion = ddnetVersion;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new ClIsDdnetLegacy(unpacker.readInt());
    }
}

class SvDdraceTimeLegacy {
    /**
     * @param {number} time
     * @param {number} check
     * @param {number} finish
     */
    constructor(
        time,
        check,
        finish,
    ) {
        /** @type {number} */
        this.time = time;
        /** @type {number} */
        this.check = check;
        /** @type {number} */
        this.finish = finish;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new SvDdraceTimeLegacy(
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
        );
    }
}

class SvRecordLegacy {
    /**
     * @param {number} serverTimeBest
     * @param {number} playerTimeBest
     */
    constructor(
        serverTimeBest,
        playerTimeBest,
    ) {
        this.serverTimeBest = serverTimeBest;
        this.playerTimeBest = playerTimeBest;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new SvRecordLegacy(unpacker.readInt(), unpacker.readInt());
    }
}

class Unused {
    /** @param {Reader} _ */
    static decode(_) { }
}

class SvTeamsStateLegacy {
    /** @param {Reader} _ */
    static decode(_) { }
}

class ClShowOthersLegacy {
    /** @param {boolean} show */
    constructor(show) {
        /** @type {boolean} */
        this.show = show;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new ClShowOthersLegacy(unpacker.readInt() == 1);
    }
}

class SvMyOwnMessage {
    /** @param {number} test */
    constructor(test) {
        this.test = test;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new SvMyOwnMessage(unpacker.readInt());
    }
}

class ClShowDistance {
    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(
        x,
        y,
    ) {
        /** @type {number} */
        this.x = x;
        /** @type {number} */
        this.y = y;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new ClShowDistance(unpacker.readInt(), unpacker.readInt());
    }
}

class ClShowOthers {
    /** @param {number} show */
    constructor(show) {
        /** @type {number} */
        this.show = show;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new ClShowOthers(unpacker.readInt());
    }
}

class SvTeamsState {
    /** @param {Reader} _ */
    static decode(_) {
        return new SvTeamsState();
    }
}

class SvDdraceTime {
    /**
     * @param {number} time
     * @param {number} check
     * @param {number} finish
     */
    constructor(
        time,
        check,
        finish,
    ) {
        /** @type {number} */
        this.time = time;
        /** @type {number} */
        this.check = check;
        /** @type {number} */
        this.finish = finish;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new SvDdraceTime(
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
        );
    }
}

class SvRecord {
    /**
     * @param {number} serverTimeBest
     * @param {number} playerTimeBest
     */
    constructor(
        serverTimeBest,
        playerTimeBest,
    ) {
        /** @type {number} */
        this.serverTimeBest = serverTimeBest;
        /** @type {number} */
        this.playerTimeBest = playerTimeBest;
    }

    /** @param {Reader} unpacker */
    static decode(unpacker) {
        return new SvRecord(unpacker.readInt(), unpacker.readInt());
    }
}

export class Game {
    /** @param {Reader} data */
    static decode(data) {
        const msgId = SystemOrGame.decode_id(data);

        if (msgId[0] == 0) {
            return this.decodeMsg(msgId[1], data);
        } else {
            throw Error();
        }
    }

    /**
     * @param {number | Uuid} msgId
     * @param {Reader} data
     */
    static decodeMsg(msgId, data) {
        if (typeof msgId === 'number') {
            switch (msgId) {
                case SV_MOTD:
                    return SvModt.decode(data);
                case SV_BROADCAST:
                    return SvBroadcast.decode(data);
                case SV_CHAT:
                    return SvChat.decode(data);
                case SV_KILL_MSG:
                    return SvKillMsg.decode(data);
                case SV_SOUND_GLOBAL:
                    return SvSoundGlobal.decode(data);
                case SV_TUNE_PARAMS:
                    return SvTuneParams.decode(data);
                case SV_EXTRA_PROJECTILE:
                    return SvExtraProjectile.decode(data);
                case SV_READY_TO_ENTER:
                    return SvReadyToEnter.decode(data);
                case SV_WEAPON_PICKUP:
                    return SvWeaponPickup.decode(data);
                case SV_EMOTICON:
                    return SvEmotion.decode(data);
                case SV_VOTE_CLEAR_OPTIONS:
                    return SvVoteClearOptions.decode(data);
                case SV_VOTE_OPTION_LIST_ADD:
                    return SvVoteOptionListAdd.decode(data);
                case SV_VOTE_OPTION_ADD:
                    return SvVoteOptionAdd.decode(data);
                case SV_VOTE_OPTION_REMOVE:
                    return SvVoteOptionRemove.decode(data);
                case SV_VOTE_SET:
                    return SvVoteSet.decode(data);
                case SV_VOTE_STATUS:
                    return SvVoteStatus.decode(data);
                case CL_SAY:
                    return ClSay.decode(data);
                case CL_SET_TEAM:
                    return ClSetTeam.decode(data);
                case CL_SET_SPECTATOR_MODE:
                    return ClSetSpectatorMode.decode(data);
                case CL_START_INFO:
                    return ClStartInfo.decode(data);
                case CL_CHANGE_INFO:
                    return ClChangeInfo.decode(data);
                case CL_KILL:
                    return ClKill.decode(data);
                case CL_EMOTICON:
                    return ClEmoticon.decode(data);
                case CL_VOTE:
                    return ClVote.decode(data);
                case CL_CALL_VOTE:
                    return ClCallVote.decode(data);
                case CL_IS_DDNET_LEGACY:
                    return ClIsDdnetLegacy.decode(data);
                case SV_DDRACE_TIME_LEGACY:
                    return SvDdraceTimeLegacy.decode(data);
                case SV_RECORD_LEGACY:
                    return SvRecordLegacy.decode(data);
                case UNUSED:
                    return Unused.decode(data);
                case SV_TEAMS_STATE_LEGACY:
                    return SvTeamsStateLegacy.decode(data);
                case CL_SHOW_OTHERS_LEGACY:
                    return ClShowOthersLegacy.decode(data);
                default:
                    console.log('Unknown id: ', msgId);
                    throw Error();
            }
        } else {
            switch (msgId.bytes.toString()) {
                case SV_MY_OWN_MESSAGE.bytes.toString():
                    return SvMyOwnMessage.decode(data);
                case CL_SHOW_DISTANCE.bytes.toString():
                    return ClShowDistance.decode(data);
                case CL_SHOW_OTHERS.bytes.toString():
                    return ClShowOthers.decode(data);
                case SV_TEAMS_STATE.bytes.toString():
                    return SvTeamsState.decode(data);
                case SV_DDRACE_TIME.bytes.toString():
                    return SvDdraceTime.decode(data);
                case SV_RECORD.bytes.toString():
                    return SvRecord.decode(data);
                default:
                    console.log('Unknown id: ', msgId);
                    throw Error();
            }
        }
    }
}
