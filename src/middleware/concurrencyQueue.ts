import {Request, Response, NextFunction, RequestHandler} from "express";

export function concurrencyQueue(maxConcurrent: number, handler: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler {
    let active = 0;
    const queue: Array<() => void> = [];

    return (req: Request, res: Response, next: NextFunction) => {
        const execute = () => {
            active++;

            handler(req, res, next).finally(() => {
                active--;

                if (queue.length > 0) {
                    const nextInQueue = queue.shift()!;
                    nextInQueue();
                }
            });
        };

        if (active < maxConcurrent) {
            execute();
        } else {
            queue.push(execute);
        }
    };
}
