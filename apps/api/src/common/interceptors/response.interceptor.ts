import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, map } from "rxjs";

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((response) => {
                return {
                    statusCode: context.switchToHttp().getResponse().statusCode,
                    message: 'Success',
                    data: response
                }
            })
        )
    }
}