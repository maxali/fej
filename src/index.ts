export type IFejMiddleware = (init: RequestInit) => RequestInit;

export type IFejAsyncMiddleware = (init: RequestInit) => Promise<RequestInit>;

class Fej {
  private static globalInit: RequestInit = {};
  private middleWares: IFejMiddleware[] = [];
  private asyncMiddleWares: IFejAsyncMiddleware[] = [];

  public fej = async (
    input: RequestInfo,
    init?: RequestInit
  ): Promise<Response> => {
    // merge setInit initializations
    let _init = this.mergeDeep(Fej.globalInit, init);

    // merge non-async middleWares
    _init = this.mergeNonAsyncMiddlewares(_init);

    _init = await this.mergeAsyncMiddlewares(_init);

    return fetch(input, _init);
  }

  public setInit = (init: RequestInit) => {
    Fej.globalInit = init;
  }

  public addMiddleware = async (fn: IFejMiddleware) => {
    function runMiddleware(_init: RequestInit) {
      return fn(_init);
    }
    this.middleWares.push(runMiddleware);
  }

  public addAsyncMiddleware = (fn: IFejAsyncMiddleware) => {
    async function runMiddleware(_init: RequestInit) {
      return await fn(_init);
    }
    this.asyncMiddleWares.push(runMiddleware);
  }

  private isObject = (item: any) => {
    return (
      item && typeof item === 'object' && !Array.isArray(item) && item !== null
    );
  }

  private mergeDeep = (target: any, source: any) => {
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (this.isObject(source[key])) {
          if (!target[key] || !this.isObject(target[key])) {
            target[key] = source[key];
          }
          this.mergeDeep(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      });
    }
    return target;
  }

  private async mergeAsyncMiddlewares(_init: any) {
    const mdwResults = await Promise.all(this.asyncMiddleWares);

    // run over Promise.all on all asyncMiddleware array
    await Promise.all(
      mdwResults.map(async (asyncMiddleware) => {
        const mdwInit = await asyncMiddleware(_init);
        _init = this.mergeDeep(_init, mdwInit);

        return _init;
      })
    );

    return _init;
  }

  private mergeNonAsyncMiddlewares(_init: any) {
    this.middleWares.map((middleware) => {
      const mdwInit = middleware(_init);
      _init = this.mergeDeep(_init, mdwInit);
    });
    return _init;
  }
}

const mFej = new Fej();
export const fej = mFej.fej;
export const setInit = mFej.setInit;
export default mFej;
