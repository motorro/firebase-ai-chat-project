export interface GetEnginesResponse {
    readonly engines: ReadonlyArray<Engine>
}

export interface Engine {
    readonly id: string
    readonly name: string
}


