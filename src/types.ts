/**
 * Gemeinsame TypeScript-Typdefinitionen für das Projekt
 */

/**
 * Represents a playback session for a station
 */
export interface Session {
    start: number;
    end: number | null;
}

/**
 * Represents a station with its playback history
 */
export interface Station {
    name: string;
    sessions: Session[];
    totalDurationMs: number;
    playCount: number;
    lastPlayed: number;
    favicon?: string;
    url?: string;
}

/**
 * Represents the complete history data structure
 */
export interface StationHistoryData {
    version: number;
    stations: Record<string, Station>;
}

/**
 * Represents a Watch Later or Queue item
 */
export interface WatchLaterItem {
    url: string;
    name: string;
    type: 'radio' | 'video';
    addedAt: number;
}

/**
 * Queue item that extends WatchLaterItem
 */
export interface QueueItem extends WatchLaterItem {}

/**
 * Represents playback progress for a media item
 */
export interface PlaybackProgress {
    currentTime: number;
    duration: number;
    lastUpdated: number;
    progressPercent: number;
}

/**
 * Formatted progress status for UI display
 */
export interface ProgressStatus {
    percent: number;
    remaining: string;
    formatted: string;
}

/**
 * Station options for starting playback
 */
export interface StationOptions {
    favicon?: string;
}

/**
 * Metadata response types
 */
export interface MetadataResponse {
    type: 'text' | 'json';
    data: string | Record<string, unknown>;
}

/**
 * Station button dataset structure
 */
export interface StationButtonDataset {
    url: string;
    name: string;
    metadataUrl?: string;
}

/**
 * Quality level information for HLS
 */
export interface QualityLevel {
    height: number;
    bitrate: number;
    name: string;
}

/**
 * Hls.js global type declaration
 */
export interface HlsType {
    isSupported: () => boolean;
    new: () => unknown;
    Events: {
        MANIFEST_PARSED: string;
        ERROR: string;
    };
    ErrorTypes: {
        NETWORK_ERROR: string;
        MEDIA_ERROR: string;
    };
}
