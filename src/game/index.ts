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
    static decode_id(data: Reader): [0 | 1, Uuid | number] {
        const id = data.readInt();
        const sys = (id & 1) != 0;
        let msg: number | Uuid = id >> 1;

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
    constructor(
        public message: string
    ) { }

    static decode(unpacker: Reader) {
        return new SvModt(textDecoder.decode(unpacker.readString()));
    }
}

class SvBroadcast {
    constructor(
        public message: string
    ) { }

    static decode(unpacker: Reader) {
        return new SvBroadcast(textDecoder.decode(unpacker.readString()));
    }
}

class SvChat {
    constructor(
        public team: boolean,
        public clientId: number,
        public message: string
    ) { }

    static decode(unpacker: Reader) {
        return new SvChat(
            unpacker.readInt() == 1,
            unpacker.readInt(),
            textDecoder.decode(unpacker.readString()),
        );
    }
}

class SvKillMsg {
    constructor(
        public killer: number,
        public victim: number,
        public weapon: number,
        public modeSpecial: number,
    ) { }

    static decode(unpacker: Reader) {
        return new SvKillMsg(
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
        );
    }
}

enum Sound {
    GunFire,
    ShotgunFire,
    GrenadeFire,
    HammerFire,
    HammerHit,
    NinjaFire,
    GrenadeExplode,
    NinjaHit,
    RifleFire,
    RifleBounce,
    WeaponSwitch,
    PlayerPainShort,
    PlayerPainLong,
    BodyLand,
    PlayerAirjump,
    PlayerJump,
    PlayerDie,
    PlayerSpawn,
    PlayerSkid,
    TeeCry,
    HookLoop,
    HookAttachGround,
    HookAttachPlayer,
    HookNoattach,
    PickupHealth,
    PickupArmor,
    PickupGrenade,
    PickupShotgun,
    PickupNinja,
    WeaponSpawn,
    WeaponNoammo,
    Hit,
    ChatServer,
    ChatClient,
    CtfDrop,
    CtfReturn,
    CtfGrabPl,
    CtfGrabEn,
    CtfCapture,
}

class SvSoundGlobal {
    constructor(
        public soundId: Sound
    ) { }

    static decode(unpacker: Reader) {
        return new SvSoundGlobal(unpacker.readInt());
    }
}

class SvTuneParams {
    constructor(
        public groundControlSpeed: number,
        public groundControlAccel: number,
        public groundFriction: number,
        public groundJumpImpulse: number,
        public airJumpImpulse: number,
        public airControlSpeed: number,
        public airControlAccel: number,
        public airFriction: number,
        public hookLength: number,
        public hookFireSpeed: number,
        public hookDragAccel: number,
        public hookDragSpeed: number,
        public gravity: number,
        public velrampStart: number,
        public velrampRange: number,
        public velrampCurvature: number,
        public gunCurvature: number,
        public gunSpeed: number,
        public gunLifetime: number,
        public shotgunCurvature: number,
        public shotgunSpeed: number,
        public shotgunSpeeddiff: number,
        public shotgunLifetime: number,
        public grenadeCurvature: number,
        public grenadeSpeed: number,
        public grenadeLifetime: number,
        public laserReach: number,
        public laserBounceDelay: number,
        public laserBounceNum: number,
        public laserBounceCost: number,
        public laserDamage: number,
        public playerCollision: number,
        public playerHooking: number,
    ) { }

    static decode(unpacker: Reader) {
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

enum Weapon {
    Hammer,
    Pistol,
    Shotgun,
    Grenade,
    Rifle,
    Ninja,
}

type Projectile = {
    x: number;
    y: number;
    velX: number;
    velY: number;
    type: Weapon;
    startTick: number;
};

class SvExtraProjectile {
    constructor(
        public projectile: Projectile
    ) { }

    static decode(unpacker: Reader) {
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
    static decode(_: Reader) {
        return new SvReadyToEnter();
    }
}

class SvWeaponPickup {
    constructor(
        public weapon: Weapon
    ) { }

    static decode(unpacker: Reader) {
        return new SvWeaponPickup(unpacker.readInt());
    }
}

enum Emoticon {
    V1,
    V2,
    V3,
    V4,
    V5,
    V6,
    V7,
    V8,
    V9,
    V10,
    V11,
    V12,
    V13,
    V14,
    V15,
}

class SvEmotion {
    constructor(
        public clientId: number,
        public emoticon: Emoticon
    ) { }

    static decode(unpacker: Reader) {
        return new SvEmotion(unpacker.readInt(), unpacker.readInt());
    }
}

class SvVoteClearOptions {
    static decode(_: Reader) {
        return new SvVoteClearOptions();
    }
}

class SvVoteOptionListAdd {
    constructor(
        public numOptions: number,
        public description: string[]
    ) { }

    static decode(unpacker: Reader) {
        return new SvVoteOptionListAdd(
            unpacker.readInt(),
            [
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
            ]
        );
    }
}

class SvVoteOptionAdd {
    constructor(
        public description: string
    ) { }

    static decode(unpacker: Reader) {
        return new SvVoteOptionAdd(textDecoder.decode(unpacker.readString()));
    }
}

class SvVoteOptionRemove {
    constructor(
        public description: string
    ) { }

    static decode(unpacker: Reader) {
        return new SvVoteOptionRemove(
            textDecoder.decode(unpacker.readString()),
        );
    }
}

class SvVoteSet {
    constructor(
        public timeout: number,
        public description: string,
        public reason: string
    ) { }

    static decode(unpacker: Reader) {
        return new SvVoteSet(
            unpacker.readInt(),
            textDecoder.decode(unpacker.readString()),
            textDecoder.decode(unpacker.readString()),
        );
    }
}

class SvVoteStatus {
    constructor(
        public yes: number,
        public no: number,
        public pass: number,
        public total: number
    ) { }

    static decode(unpacker: Reader) {
        return new SvVoteStatus(
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
        );
    }
}

class ClSay {
    constructor(
        public team: boolean,
        public message: string
    ) { }

    static decode(unpacker: Reader) {
        return new ClSay(
            unpacker.readInt() == 1,
            textDecoder.decode(unpacker.readString()),
        );
    }
}

enum Team {
    Spectators = -1,
    Red,
    Blue,
}

class ClSetTeam {
    constructor(
        public team: Team
    ) { }

    static decode(unpacker: Reader) {
        return new ClSetTeam(unpacker.readInt());
    }
}

class ClSetSpectatorMode {
    constructor(
        public spectatorId: number
    ) { }

    static decode(unpacker: Reader) {
        return new ClSetSpectatorMode(unpacker.readInt());
    }
}

class ClStartInfo {
    constructor(
        public name: string,
        public clan: string,
        public country: number,
        public skin: string,
        public useCustomColor: boolean,
        public colorBody: number,
        public colorFeet: number,
    ) { }

    static decode(unpacker: Reader) {
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
    constructor(
        public name: string,
        public clan: string,
        public country: number,
        public skin: string,
        public useCustomColor: boolean,
        public colorBody: number,
        public colorFeet: number,
    ) { }

    static decode(unpacker: Reader) {
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
    static decode(_: Reader) { }
}

class ClEmoticon {
    constructor(
        public emoticon: Emoticon
    ) { }

    static decode(unpacker: Reader) {
        return new ClEmoticon(unpacker.readInt());
    }
}

class ClVote {
    constructor(
        public vote: number
    ) { }

    static decode(unpacker: Reader) {
        return new ClVote(unpacker.readInt());
    }
}

class ClCallVote {
    constructor(
        public type: string,
        public value: string,
        public reason: string
    ) { }

    static decode(unpacker: Reader) {
        return new ClCallVote(
            textDecoder.decode(unpacker.readString()),
            textDecoder.decode(unpacker.readString()),
            textDecoder.decode(unpacker.readString()),
        );
    }
}

class ClIsDdnetLegacy {
    constructor(
        public ddnetVersion: number
    ) { }

    static decode(unpacker: Reader) {
        return new ClIsDdnetLegacy(unpacker.readInt());
    }
}

class SvDdraceTimeLegacy {
    constructor(
        public time: number,
        public check: number,
        public finish: number
    ) { }

    static decode(unpacker: Reader) {
        return new SvDdraceTimeLegacy(
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
        );
    }
}

class SvRecordLegacy {
    constructor(
        public serverTimeBest: number,
        public playerTimeBest: number
    ) { }

    static decode(unpacker: Reader) {
        return new SvRecordLegacy(unpacker.readInt(), unpacker.readInt());
    }
}

class Unused {
    static decode(_: Reader) { }
}

class SvTeamsStateLegacy {
    static decode(_: Reader) { }
}

class ClShowOthersLegacy {
    constructor(
        public show: boolean
    ) { }

    static decode(unpacker: Reader) {
        return new ClShowOthersLegacy(unpacker.readInt() == 1);
    }
}

class SvMyOwnMessage {
    constructor(
        public test: number
    ) { }

    static decode(unpacker: Reader) {
        return new SvMyOwnMessage(unpacker.readInt());
    }
}

class ClShowDistance {
    constructor(
        public x: number,
        public y: number
    ) { }

    static decode(unpacker: Reader) {
        return new ClShowDistance(unpacker.readInt(), unpacker.readInt());
    }
}

class ClShowOthers {
    constructor(
        public show: number
    ) { }

    static decode(unpacker: Reader) {
        return new ClShowOthers(unpacker.readInt());
    }
}

class SvTeamsState {
    static decode(_: Reader) {
        return new SvTeamsState();
    }
}

class SvDdraceTime {
    constructor(
        public time: number,
        public check: number,
        public finish: number
    ) { }

    static decode(unpacker: Reader) {
        return new SvDdraceTime(
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
        );
    }
}

class SvRecord {
    constructor(
        public serverTimeBest: number,
        public playerTimeBest: number
    ) { }

    static decode(unpacker: Reader) {
        return new SvRecord(unpacker.readInt(), unpacker.readInt());
    }
}

export class Game {
    static decode(data: Reader) {
        const msgId = SystemOrGame.decode_id(data);

        if (msgId[0] == 0) {
            return this.decodeMsg(msgId[1], data);
        } else {
            throw Error();
        }
    }

    static decodeMsg(msgId: number | Uuid, data: Reader) {
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
