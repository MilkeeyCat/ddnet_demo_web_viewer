import { Unpacker } from '../unpacker';
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
    static decode_id(data: Unpacker): [0 | 1, Uuid | number] {
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
    message: string;

    constructor(message: string) {
        this.message = message;
    }

    static decode(unpacker: Unpacker) {
        return new SvModt(textDecoder.decode(unpacker.readString()));
    }
}

class SvBroadcast {
    message: string;

    constructor(message: string) {
        this.message = message;
    }

    static decode(unpacker: Unpacker) {
        return new SvBroadcast(textDecoder.decode(unpacker.readString()));
    }
}

class SvChat {
    team: boolean;
    clientId: number;
    message: string;

    constructor(team: boolean, clientId: number, message: string) {
        this.team = team;
        this.clientId = clientId;
        this.message = message;
    }

    static decode(unpacker: Unpacker) {
        return new SvChat(
            unpacker.readInt() == 1,
            unpacker.readInt(),
            textDecoder.decode(unpacker.readString()),
        );
    }
}

class SvKillMsg {
    killer: number;
    victim: number;
    weapon: number;
    modeSpecial: number;

    constructor(
        killer: number,
        victim: number,
        weapon: number,
        modeSpecial: number,
    ) {
        this.killer = killer;
        this.victim = victim;
        this.weapon = weapon;
        this.modeSpecial = modeSpecial;
    }

    static decode(unpacker: Unpacker) {
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
    sound_id: Sound;

    constructor(sound_id: Sound) {
        this.sound_id = sound_id;
    }

    static decode(unpacker: Unpacker) {
        return new SvSoundGlobal(unpacker.readInt());
    }
}

class SvTuneParams {
    groundControlSpeed: number;
    ground_controlAccel: number;
    groundFriction: number;
    groundJumpImpulse: number;
    airJumpImpulse: number;
    airControlSpeed: number;
    airControlAccel: number;
    airFriction: number;
    hookLength: number;
    hookFireSpeed: number;
    hookDragAccel: number;
    hookDragSpeed: number;
    gravity: number;
    velrampStart: number;
    velrampRange: number;
    velrampCurvature: number;
    gunCurvature: number;
    gunSpeed: number;
    gunLifetime: number;
    shotgunCurvature: number;
    shotgunSpeed: number;
    shotgunSpeeddiff: number;
    shotgunLifetime: number;
    grenadeCurvature: number;
    grenadeSpeed: number;
    grenadeLifetime: number;
    laserReach: number;
    laserBounceDelay: number;
    laserBounceNum: number;
    laserBounceCost: number;
    laserDamage: number;
    playerCollision: number;
    playerHooking: number;

    constructor(
        groundControlSpeed: number,
        ground_controlAccel: number,
        groundFriction: number,
        groundJumpImpulse: number,
        airJumpImpulse: number,
        airControlSpeed: number,
        airControlAccel: number,
        airFriction: number,
        hookLength: number,
        hookFireSpeed: number,
        hookDragAccel: number,
        hookDragSpeed: number,
        gravity: number,
        velrampStart: number,
        velrampRange: number,
        velrampCurvature: number,
        gunCurvature: number,
        gunSpeed: number,
        gunLifetime: number,
        shotgunCurvature: number,
        shotgunSpeed: number,
        shotgunSpeeddiff: number,
        shotgunLifetime: number,
        grenadeCurvature: number,
        grenadeSpeed: number,
        grenadeLifetime: number,
        laserReach: number,
        laserBounceDelay: number,
        laserBounceNum: number,
        laserBounceCost: number,
        laserDamage: number,
        playerCollision: number,
        playerHooking: number,
    ) {
        this.groundControlSpeed = groundControlSpeed;
        this.ground_controlAccel = ground_controlAccel;
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

    static decode(unpacker: Unpacker) {
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
    projectile: Projectile;

    constructor(projectile: Projectile) {
        this.projectile = projectile;
    }

    static decode(unpacker: Unpacker) {
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
    //@ts-ignore
    static decode(unpacker: Unpacker) {
        return new SvReadyToEnter();
    }
}

class SvWeaponPickup {
    weapon: Weapon;

    constructor(weapon: Weapon) {
        this.weapon = weapon;
    }

    static decode(unpacker: Unpacker) {
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
    clientId: number;
    emoticon: Emoticon;

    constructor(clientId: number, emoticon: Emoticon) {
        this.clientId = clientId;
        this.emoticon = emoticon;
    }

    static decode(unpacker: Unpacker) {
        return new SvEmotion(unpacker.readInt(), unpacker.readInt());
    }
}

class SvVoteClearOptions {
    //@ts-ignore
    static decode(unpacker: Unpacker) {
        return new SvVoteClearOptions();
    }
}

class SvVoteOptionListAdd {
    numOptions: number;
    description: string[];

    constructor(numOptions: number, description: string[]) {
        this.numOptions = numOptions;
        this.description = description;
    }

    static decode(unpacker: Unpacker) {
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
    description: string;

    constructor(description: string) {
        this.description = description;
    }

    static decode(unpacker: Unpacker) {
        return new SvVoteOptionAdd(textDecoder.decode(unpacker.readString()));
    }
}

class SvVoteOptionRemove {
    description: string;

    constructor(description: string) {
        this.description = description;
    }

    static decode(unpacker: Unpacker) {
        return new SvVoteOptionRemove(
            textDecoder.decode(unpacker.readString()),
        );
    }
}

class SvVoteSet {
    timeout: number;
    description: string;
    reason: string;

    constructor(timeout: number, description: string, reason: string) {
        this.timeout = timeout;
        this.description = description;
        this.reason = reason;
    }

    static decode(unpacker: Unpacker) {
        return new SvVoteSet(
            unpacker.readInt(),
            textDecoder.decode(unpacker.readString()),
            textDecoder.decode(unpacker.readString()),
        );
    }
}

class SvVoteStatus {
    yes: number;
    no: number;
    pass: number;
    total: number;

    constructor(yes: number, no: number, pass: number, total: number) {
        this.yes = yes;
        this.no = no;
        this.pass = pass;
        this.total = total;
    }

    static decode(unpacker: Unpacker) {
        return new SvVoteStatus(
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
        );
    }
}

class ClSay {
    team: boolean;
    message: string;

    constructor(team: boolean, message: string) {
        this.team = team;
        this.message = message;
    }

    static decode(unpacker: Unpacker) {
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
    team: Team;

    constructor(team: Team) {
        this.team = team;
    }

    static decode(unpacker: Unpacker) {
        return new ClSetTeam(unpacker.readInt());
    }
}

class ClSetSpectatorMode {
    spectatorId: number;

    constructor(spectatorId: number) {
        this.spectatorId = spectatorId;
    }

    static decode(unpacker: Unpacker) {
        return new ClSetSpectatorMode(unpacker.readInt());
    }
}

class ClStartInfo {
    name: string;
    clan: string;
    country: number;
    skin: string;
    useCustomColor: boolean;
    colorBody: number;
    colorFeet: number;

    constructor(
        name: string,
        clan: string,
        country: number,
        skin: string,
        useCustomColor: boolean,
        colorBody: number,
        colorFeet: number,
    ) {
        this.name = name;
        this.clan = clan;
        this.country = country;
        this.skin = skin;
        this.useCustomColor = useCustomColor;
        this.colorBody = colorBody;
        this.colorFeet = colorFeet;
    }

    static decode(unpacker: Unpacker) {
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
    name: string;
    clan: string;
    country: number;
    skin: string;
    useCustomColor: boolean;
    colorBody: number;
    colorFeet: number;

    constructor(
        name: string,
        clan: string,
        country: number,
        skin: string,
        useCustomColor: boolean,
        colorBody: number,
        colorFeet: number,
    ) {
        this.name = name;
        this.clan = clan;
        this.country = country;
        this.skin = skin;
        this.useCustomColor = useCustomColor;
        this.colorBody = colorBody;
        this.colorFeet = colorFeet;
    }

    static decode(unpacker: Unpacker) {
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
    //@ts-ignore
    static decode(unpacker: Unpacker) {}
}

class ClEmoticon {
    emoticon: Emoticon;

    constructor(emoticon: Emoticon) {
        this.emoticon = emoticon;
    }

    static decode(unpacker: Unpacker) {
        return new ClEmoticon(unpacker.readInt());
    }
}

class ClVote {
    vote: number;

    constructor(vote: number) {
        this.vote = vote;
    }

    static decode(unpacker: Unpacker) {
        return new ClVote(unpacker.readInt());
    }
}

class ClCallVote {
    type: string;
    value: string;
    reason: string;

    constructor(type: string, value: string, reason: string) {
        this.type = type;
        this.value = value;
        this.reason = reason;
    }

    static decode(unpacker: Unpacker) {
        return new ClCallVote(
            textDecoder.decode(unpacker.readString()),
            textDecoder.decode(unpacker.readString()),
            textDecoder.decode(unpacker.readString()),
        );
    }
}

class ClIsDdnetLegacy {
    ddnetVersion: number;

    constructor(ddnetVersion: number) {
        this.ddnetVersion = ddnetVersion;
    }

    static decode(unpacker: Unpacker) {
        return new ClIsDdnetLegacy(unpacker.readInt());
    }
}

class SvDdraceTimeLegacy {
    time: number;
    check: number;
    finish: number;

    constructor(time: number, check: number, finish: number) {
        this.time = time;
        this.check = check;
        this.finish = finish;
    }

    static decode(unpacker: Unpacker) {
        return new SvDdraceTimeLegacy(
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
        );
    }
}

class SvRecordLegacy {
    serverTimeBest: number;
    playerTimeBest: number;

    constructor(serverTimeBest: number, playerTimeBest: number) {
        this.serverTimeBest = serverTimeBest;
        this.playerTimeBest = playerTimeBest;
    }

    static decode(unpacker: Unpacker) {
        return new SvRecordLegacy(unpacker.readInt(), unpacker.readInt());
    }
}

class Unused {
    //@ts-ignore
    static decode(unpacker: Unpacker) {}
}

class SvTeamsStateLegacy {
    //@ts-ignore
    static decode(unpacker: Unpacker) {}
}

class ClShowOthersLegacy {
    show: boolean;

    constructor(show: boolean) {
        this.show = show;
    }

    static decode(unpacker: Unpacker) {
        return new ClShowOthersLegacy(unpacker.readInt() == 1);
    }
}

class SvMyOwnMessage {
    test: number;

    constructor(test: number) {
        this.test = test;
    }

    static decode(unpacker: Unpacker) {
        return new SvMyOwnMessage(unpacker.readInt());
    }
}

class ClShowDistance {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    static decode(unpacker: Unpacker) {
        return new ClShowDistance(unpacker.readInt(), unpacker.readInt());
    }
}

class ClShowOthers {
    show: number;

    constructor(show: number) {
        this.show = show;
    }

    static decode(unpacker: Unpacker) {
        return new ClShowOthers(unpacker.readInt());
    }
}

class SvTeamsState {
    //@ts-ignore
    static decode(unpacker: Unpacker) {
        return new SvTeamsState();
    }
}

class SvDdraceTime {
    time: number;
    check: number;
    finish: number;

    constructor(time: number, check: number, finish: number) {
        this.time = time;
        this.check = check;
        this.finish = finish;
    }

    static decode(unpacker: Unpacker) {
        return new SvDdraceTime(
            unpacker.readInt(),
            unpacker.readInt(),
            unpacker.readInt(),
        );
    }
}

class SvRecord {
    serverTimeBest: number;
    playerTimeBest: number;

    constructor(serverTimeBest: number, playerTimeBest: number) {
        this.serverTimeBest = serverTimeBest;
        this.playerTimeBest = playerTimeBest;
    }

    static decode(unpacker: Unpacker) {
        return new SvRecord(unpacker.readInt(), unpacker.readInt());
    }
}

export class Game {
    static decode(data: Unpacker) {
        const msgId = SystemOrGame.decode_id(data);

        if (msgId[0] == 0) {
            return this.decodeMsg(msgId[1], data);
        } else {
            throw Error();
        }
    }

    static decodeMsg(msgId: number | Uuid, data: Unpacker) {
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
