/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/* tslint:disable:no-console  */
import {logging, WebDriver} from 'selenium-webdriver';

declare var browser: WebDriver;
declare var expect: any;

// TODO (juliemr): remove this method once this becomes a protractor plugin
export async function verifyNoBrowserErrors() {
  const browserLog = await browser.manage().logs().get('browser');
  const collectedErrors: any[] = [];

  browserLog.forEach((logEntry) => {
    const msg = logEntry.message;

    console.log('>> ' + msg, logEntry);

    if (logEntry.level.value >= logging.Level.INFO.value) {
      collectedErrors.push(msg);
    }
  });

  expect(collectedErrors).toEqual([]);
}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// #docplaster
import {
  Component,
  Directive,
  ElementRef,
  EventEmitter,
  Injectable,
  Injector,
  Input,
  NgModule,
  Output,
} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {
  downgradeComponent,
  downgradeInjectable,
  UpgradeComponent,
  UpgradeModule,
} from '@angular/upgrade/static';

declare var angular: ng.IAngularStatic;

export interface Hero {
  name: string;
  description: string;
}

// #docregion ng1-text-formatter-service
export class TextFormatter {
  titleCase(value: string) {
    return value.replace(/((^|\s)[a-z])/g, (_, c) => c.toUpperCase());
  }
}

// #enddocregion
// #docregion ng2-heroes
// This Angular component will be "downgraded" to be used in AngularJS
@Component({
  selector: 'ng2-heroes',
  // This template uses the upgraded `ng1-hero` component
  // Note that because its element is compiled by Angular we must use camelCased attribute names
  template: `
    <header><ng-content selector="h1"></ng-content></header>
    <ng-content selector=".extra"></ng-content>
    <div *ngFor="let hero of heroes">
      <ng1-hero [hero]="hero" (onRemove)="removeHero.emit(hero)">
        <strong>Super Hero</strong>
      </ng1-hero>
    </div>
    <button (click)="addHero.emit()">Add Hero</button>
  `,
})
export class Ng2HeroesComponent {
  @Input() heroes!: Hero[];
  @Output() addHero = new EventEmitter();
  @Output() removeHero = new EventEmitter();
}
// #enddocregion

// #docregion ng2-heroes-service
// This Angular service will be "downgraded" to be used in AngularJS
@Injectable()
export class HeroesService {
  heroes: Hero[] = [
    {name: 'superman', description: 'The man of steel'},
    {name: 'wonder woman', description: 'Princess of the Amazons'},
    {name: 'thor', description: 'The hammer-wielding god'},
  ];

  // #docregion use-ng1-upgraded-service
  constructor(textFormatter: TextFormatter) {
    // Change all the hero names to title case, using the "upgraded" AngularJS service
    this.heroes.forEach((hero: Hero) => (hero.name = textFormatter.titleCase(hero.name)));
  }
  // #enddocregion

  addHero() {
    this.heroes = this.heroes.concat([
      {name: 'Kamala Khan', description: 'Epic shape-shifting healer'},
    ]);
  }

  removeHero(hero: Hero) {
    this.heroes = this.heroes.filter((item: Hero) => item !== hero);
  }
}
// #enddocregion

// #docregion ng1-hero-wrapper
// This Angular directive will act as an interface to the "upgraded" AngularJS component
@Directive({selector: 'ng1-hero'})
export class Ng1HeroComponentWrapper extends UpgradeComponent {
  // The names of the input and output properties here must match the names of the
  // `<` and `&` bindings in the AngularJS component that is being wrapped
  @Input() hero!: Hero;
  @Output() onRemove!: EventEmitter<void>;

  constructor(elementRef: ElementRef, injector: Injector) {
    // We must pass the name of the directive as used by AngularJS to the super
    super('ng1Hero', elementRef, injector);
  }
}
// #enddocregion

// #docregion ng2-module
// This NgModule represents the Angular pieces of the application
@NgModule({
  declarations: [Ng2HeroesComponent, Ng1HeroComponentWrapper],
  providers: [
    HeroesService,
    // #docregion upgrade-ng1-service
    // Register an Angular provider whose value is the "upgraded" AngularJS service
    {provide: TextFormatter, useFactory: (i: any) => i.get('textFormatter'), deps: ['$injector']},
    // #enddocregion
  ],
  // We must import `UpgradeModule` to get access to the AngularJS core services
  imports: [BrowserModule, UpgradeModule],
})
// #docregion bootstrap-ng1
export class Ng2AppModule {
  // #enddocregion ng2-module
  constructor(private upgrade: UpgradeModule) {}

  ngDoBootstrap() {
    // We bootstrap the AngularJS app.
    this.upgrade.bootstrap(document.body, [ng1AppModule.name]);
  }
  // #docregion ng2-module
}
// #enddocregion bootstrap-ng1
// #enddocregion ng2-module

// This Angular 1 module represents the AngularJS pieces of the application
export const ng1AppModule: ng.IModule = angular.module('ng1AppModule', []);

// #docregion ng1-hero
// This AngularJS component will be "upgraded" to be used in Angular
ng1AppModule.component('ng1Hero', {
  bindings: {hero: '<', onRemove: '&'},
  transclude: true,
  template: `<div class="title" ng-transclude></div>
             <h2>{{ $ctrl.hero.name }}</h2>
             <p>{{ $ctrl.hero.description }}</p>
             <button ng-click="$ctrl.onRemove()">Remove</button>`,
});
// #enddocregion

// #docregion ng1-text-formatter-service
// This AngularJS service will be "upgraded" to be used in Angular
ng1AppModule.service('textFormatter', [TextFormatter]);
// #enddocregion

// #docregion downgrade-ng2-heroes-service
// Register an AngularJS service, whose value is the "downgraded" Angular injectable.
ng1AppModule.factory('heroesService', downgradeInjectable(HeroesService) as any);
// #enddocregion

// #docregion ng2-heroes-wrapper
// This directive will act as the interface to the "downgraded" Angular component
ng1AppModule.directive('ng2Heroes', downgradeComponent({component: Ng2HeroesComponent}));
// #enddocregion

// #docregion example-app
// This is our top level application component
ng1AppModule.component('exampleApp', {
  // We inject the "downgraded" HeroesService into this AngularJS component
  // (We don't need the `HeroesService` type for AngularJS DI - it just helps with TypeScript
  // compilation)
  controller: [
    'heroesService',
    function (heroesService: HeroesService) {
      this.heroesService = heroesService;
    },
  ],
  // This template makes use of the downgraded `ng2-heroes` component
  // Note that because its element is compiled by AngularJS we must use kebab-case attributes
  // for inputs and outputs
  template: `<link rel="stylesheet" href="./styles.css">
          <ng2-heroes [heroes]="$ctrl.heroesService.heroes" (add-hero)="$ctrl.heroesService.addHero()" (remove-hero)="$ctrl.heroesService.removeHero($event)">
            <h1>Heroes</h1>
            <p class="extra">There are {{ $ctrl.heroesService.heroes.length }} heroes.</p>
          </ng2-heroes>`,
});
// #enddocregion

// #docregion bootstrap-ng2
// We bootstrap the Angular module as we would do in a normal Angular app.
// (We are using the dynamic browser platform as this example has not been compiled AOT.)
platformBrowserDynamic().bootstrapModule(Ng2AppModule);
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// #docregion angular-setup
import {TestBed} from '@angular/core/testing';
import {
  createAngularJSTestingModule,
  createAngularTestingModule,
} from '@angular/upgrade/static/testing';

import {HeroesService, ng1AppModule, Ng2AppModule} from './module';

const {module, inject} = (window as any).angular.mock;

// #enddocregion angular-setup
describe('HeroesService (from Angular)', () => {
  // #docregion angular-setup
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [createAngularTestingModule([ng1AppModule.name]), Ng2AppModule],
    });
  });
  // #enddocregion angular-setup

  // #docregion angular-spec
  it('should have access to the HeroesService', () => {
    const heroesService = TestBed.inject(HeroesService);
    expect(heroesService).toBeDefined();
  });
  // #enddocregion angular-spec
});

describe('HeroesService (from AngularJS)', () => {
  // #docregion angularjs-setup
  beforeEach(module(createAngularJSTestingModule([Ng2AppModule])));
  beforeEach(module(ng1AppModule.name));
  // #enddocregion angularjs-setup

  // #docregion angularjs-spec
  it('should have access to the HeroesService', inject((heroesService: HeroesService) => {
    expect(heroesService).toBeDefined();
  }));
  // #enddocregion angularjs-spec
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {browser, by, element} from 'protractor';
import {verifyNoBrowserErrors} from '../../../../../test-utils';

function loadPage() {
  browser.rootEl = 'example-app';
  browser.get('/');
}

describe('upgrade/static (full)', () => {
  beforeEach(loadPage);
  afterEach(verifyNoBrowserErrors);

  it('should render the `ng2-heroes` component', () => {
    expect(element(by.css('h1')).getText()).toEqual('Heroes');
    expect(element.all(by.css('p')).get(0).getText()).toEqual('There are 3 heroes.');
  });

  it('should render 3 ng1-hero components', () => {
    const heroComponents = element.all(by.css('ng1-hero'));
    expect(heroComponents.count()).toEqual(3);
  });

  it('should add a new hero when the "Add Hero" button is pressed', () => {
    const addHeroButton = element.all(by.css('button')).last();
    expect(addHeroButton.getText()).toEqual('Add Hero');
    addHeroButton.click();
    const heroComponents = element.all(by.css('ng1-hero'));
    expect(heroComponents.last().element(by.css('h2')).getText()).toEqual('Kamala Khan');
  });

  it('should remove a hero when the "Remove" button is pressed', () => {
    let firstHero = element.all(by.css('ng1-hero')).get(0);
    expect(firstHero.element(by.css('h2')).getText()).toEqual('Superman');

    const removeHeroButton = firstHero.element(by.css('button'));
    expect(removeHeroButton.getText()).toEqual('Remove');
    removeHeroButton.click();

    const heroComponents = element.all(by.css('ng1-hero'));
    expect(heroComponents.count()).toEqual(2);

    firstHero = element.all(by.css('ng1-hero')).get(0);
    expect(firstHero.element(by.css('h2')).getText()).toEqual('Wonder Woman');
  });
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// #docplaster
import {
  Component,
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  Injectable,
  Injector,
  Input,
  NgModule,
  Output,
  StaticProvider,
} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
// #docregion basic-how-to
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
// #enddocregion
/* tslint:disable: no-duplicate-imports */
// #docregion basic-how-to
import {downgradeComponent, downgradeModule, UpgradeComponent} from '@angular/upgrade/static';

// #enddocregion
/* tslint:enable: no-duplicate-imports */

declare var angular: ng.IAngularStatic;

interface Hero {
  name: string;
  description: string;
}

// This Angular service will use an "upgraded" AngularJS service.
@Injectable()
class HeroesService {
  heroes: Hero[] = [
    {name: 'superman', description: 'The man of steel'},
    {name: 'wonder woman', description: 'Princess of the Amazons'},
    {name: 'thor', description: 'The hammer-wielding god'},
  ];

  constructor(@Inject('titleCase') titleCase: (v: string) => string) {
    // Change all the hero names to title case, using the "upgraded" AngularJS service.
    this.heroes.forEach((hero: Hero) => (hero.name = titleCase(hero.name)));
  }

  addHero() {
    const newHero: Hero = {name: 'Kamala Khan', description: 'Epic shape-shifting healer'};
    this.heroes = this.heroes.concat([newHero]);
    return newHero;
  }

  removeHero(hero: Hero) {
    this.heroes = this.heroes.filter((item: Hero) => item !== hero);
  }
}

// This Angular component will be "downgraded" to be used in AngularJS.
@Component({
  selector: 'ng2-heroes',
  // This template uses the "upgraded" `ng1-hero` component
  // (Note that because its element is compiled by Angular we must use camelCased attribute names.)
  template: `
    <div class="ng2-heroes">
      <header><ng-content selector="h1"></ng-content></header>
      <ng-content selector=".extra"></ng-content>
      <div *ngFor="let hero of this.heroesService.heroes">
        <ng1-hero [hero]="hero" (onRemove)="onRemoveHero(hero)">
          <strong>Super Hero</strong>
        </ng1-hero>
      </div>
      <button (click)="onAddHero()">Add Hero</button>
    </div>
  `,
})
class Ng2HeroesComponent {
  @Output() private addHero = new EventEmitter<Hero>();
  @Output() private removeHero = new EventEmitter<Hero>();

  constructor(
    @Inject('$rootScope') private $rootScope: ng.IRootScopeService,
    public heroesService: HeroesService,
  ) {}

  onAddHero() {
    const newHero = this.heroesService.addHero();
    this.addHero.emit(newHero);

    // When a new instance of an "upgraded" component - such as `ng1Hero` - is created, we want to
    // run a `$digest` to initialize its bindings. Here, the component will be created by `ngFor`
    // asynchronously, thus we have to schedule the `$digest` to also happen asynchronously.
    this.$rootScope.$applyAsync();
  }

  onRemoveHero(hero: Hero) {
    this.heroesService.removeHero(hero);
    this.removeHero.emit(hero);
  }
}

// This Angular directive will act as an interface to the "upgraded" AngularJS component.
@Directive({selector: 'ng1-hero'})
class Ng1HeroComponentWrapper extends UpgradeComponent {
  // The names of the input and output properties here must match the names of the
  // `<` and `&` bindings in the AngularJS component that is being wrapped.
  @Input() hero!: Hero;
  @Output() onRemove!: EventEmitter<void>;

  constructor(elementRef: ElementRef, injector: Injector) {
    // We must pass the name of the directive as used by AngularJS to the super.
    super('ng1Hero', elementRef, injector);
  }
}

// This Angular module represents the Angular pieces of the application.
@NgModule({
  imports: [BrowserModule],
  declarations: [Ng2HeroesComponent, Ng1HeroComponentWrapper],
  providers: [
    HeroesService,
    // Register an Angular provider whose value is the "upgraded" AngularJS service.
    {provide: 'titleCase', useFactory: (i: any) => i.get('titleCase'), deps: ['$injector']},
  ],
  // Note that there are no `bootstrap` components, since the "downgraded" component
  // will be instantiated by ngUpgrade.
})
class MyLazyAngularModule {
  // Empty placeholder method to prevent the `Compiler` from complaining.
  ngDoBootstrap() {}
}

// #docregion basic-how-to

// The function that will bootstrap the Angular module (when/if necessary).
// (This would be omitted if we provided an `NgModuleFactory` directly.)
const ng2BootstrapFn = (extraProviders: StaticProvider[]) =>
  platformBrowserDynamic(extraProviders).bootstrapModule(MyLazyAngularModule);
// #enddocregion
// (We are using the dynamic browser platform, as this example has not been compiled AOT.)

// #docregion basic-how-to

// This AngularJS module represents the AngularJS pieces of the application.
const myMainAngularJsModule = angular.module('myMainAngularJsModule', [
  // We declare a dependency on the "downgraded" Angular module.
  downgradeModule(ng2BootstrapFn),
  // or
  // downgradeModule(MyLazyAngularModuleFactory)
]);
// #enddocregion

// This AngularJS component will be "upgraded" to be used in Angular.
myMainAngularJsModule.component('ng1Hero', {
  bindings: {hero: '<', onRemove: '&'},
  transclude: true,
  template: `
    <div class="ng1-hero">
      <div class="title" ng-transclude></div>
      <h2>{{ $ctrl.hero.name }}</h2>
      <p>{{ $ctrl.hero.description }}</p>
      <button ng-click="$ctrl.onRemove()">Remove</button>
    </div>
  `,
});

// This AngularJS service will be "upgraded" to be used in Angular.
myMainAngularJsModule.factory(
  'titleCase',
  () => (value: string) => value.replace(/(^|\s)[a-z]/g, (m) => m.toUpperCase()),
);

// This directive will act as the interface to the "downgraded" Angular component.
myMainAngularJsModule.directive(
  'ng2Heroes',
  downgradeComponent({
    component: Ng2HeroesComponent,
    // Optionally, disable `$digest` propagation to avoid unnecessary change detection.
    // (Change detection is still run when the inputs of a "downgraded" component change.)
    propagateDigest: false,
  }),
);

// This is our top level application component.
myMainAngularJsModule.component('exampleApp', {
  // This template makes use of the "downgraded" `ng2-heroes` component,
  // but loads it lazily only when/if the user clicks the button.
  // (Note that because its element is compiled by AngularJS,
  //  we must use kebab-case attributes for inputs and outputs.)
  template: `
    <link rel="stylesheet" href="./styles.css">
    <button ng-click="$ctrl.toggleHeroes()">{{ $ctrl.toggleBtnText() }}</button>
    <ng2-heroes
        ng-if="$ctrl.showHeroes"
        (add-hero)="$ctrl.setStatusMessage('Added hero ' + $event.name)"
        (remove-hero)="$ctrl.setStatusMessage('Removed hero ' + $event.name)">
      <h1>Heroes</h1>
      <p class="extra">Status: {{ $ctrl.statusMessage }}</p>
    </ng2-heroes>
  `,
  controller: function () {
    this.showHeroes = false;
    this.statusMessage = 'Ready';

    this.setStatusMessage = (msg: string) => (this.statusMessage = msg);
    this.toggleHeroes = () => (this.showHeroes = !this.showHeroes);
    this.toggleBtnText = () => `${this.showHeroes ? 'Hide' : 'Show'} heroes`;
  },
});

// We bootstrap the Angular module as we would do in a normal Angular app.
angular.bootstrap(document.body, [myMainAngularJsModule.name]);

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {browser, by, element, ElementArrayFinder, ElementFinder} from 'protractor';

import {verifyNoBrowserErrors} from '../../../../../test-utils';

import {addCustomMatchers} from './e2e_util';

function loadPage() {
  browser.rootEl = 'example-app';
  browser.get('/');
}

describe('upgrade/static (lite)', () => {
  let showHideBtn: ElementFinder;
  let ng2Heroes: ElementFinder;
  let ng2HeroesHeader: ElementFinder;
  let ng2HeroesExtra: ElementFinder;
  let ng2HeroesAddBtn: ElementFinder;
  let ng1Heroes: ElementArrayFinder;

  const expectHeroes = (isShown: boolean, ng1HeroCount = 3, statusMessage = 'Ready') => {
    // Verify the show/hide button text.
    expect(showHideBtn.getText()).toBe(isShown ? 'Hide heroes' : 'Show heroes');

    // Verify the `<ng2-heroes>` component.
    expect(ng2Heroes.isPresent()).toBe(isShown);
    if (isShown) {
      expect(ng2HeroesHeader.getText()).toBe('Heroes');
      expect(ng2HeroesExtra.getText()).toBe(`Status: ${statusMessage}`);
    }

    // Verify the `<ng1-hero>` components.
    expect(ng1Heroes.count()).toBe(isShown ? ng1HeroCount : 0);
    if (isShown) {
      ng1Heroes.each((ng1Hero) => expect(ng1Hero).toBeAHero());
    }
  };

  beforeEach(() => {
    showHideBtn = element(by.binding('toggleBtnText'));

    ng2Heroes = element(by.css('.ng2-heroes'));
    ng2HeroesHeader = ng2Heroes.element(by.css('h1'));
    ng2HeroesExtra = ng2Heroes.element(by.css('.extra'));
    ng2HeroesAddBtn = ng2Heroes.element(by.buttonText('Add Hero'));

    ng1Heroes = element.all(by.css('.ng1-hero'));
  });
  beforeEach(addCustomMatchers);
  beforeEach(loadPage);
  afterEach(verifyNoBrowserErrors);

  it('should initially not render the heroes', () => expectHeroes(false));

  it('should toggle the heroes when clicking the "show/hide" button', () => {
    showHideBtn.click();
    expectHeroes(true);

    showHideBtn.click();
    expectHeroes(false);
  });

  it('should add a new hero when clicking the "add" button', () => {
    showHideBtn.click();
    ng2HeroesAddBtn.click();

    expectHeroes(true, 4, 'Added hero Kamala Khan');
    expect(ng1Heroes.last()).toHaveName('Kamala Khan');
  });

  it('should remove a hero when clicking its "remove" button', () => {
    showHideBtn.click();

    const firstHero = ng1Heroes.first();
    expect(firstHero).toHaveName('Superman');

    const removeBtn = firstHero.element(by.buttonText('Remove'));
    removeBtn.click();

    expectHeroes(true, 2, 'Removed hero Superman');
    expect(ng1Heroes.first()).not.toHaveName('Superman');
  });
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {by, ElementFinder} from 'protractor';

declare global {
  namespace jasmine {
    interface Matchers<T> {
      toBeAHero(): Promise<void>;
      toHaveName(exectedName: string): Promise<void>;
    }
  }
}

const isTitleCased = (text: string) =>
  text.split(/\s+/).every((word) => word[0] === word[0].toUpperCase());

export function addCustomMatchers() {
  jasmine.addMatchers({
    toBeAHero: () => ({
      compare(actualNg1Hero: ElementFinder | undefined) {
        const getText = (selector: string) => actualNg1Hero!.element(by.css(selector)).getText();
        const result = {
          message: 'Expected undefined to be an `ng1Hero` ElementFinder.',
          pass:
            !!actualNg1Hero &&
            Promise.all(['.title', 'h2', 'p'].map(getText) as PromiseLike<string>[]).then(
              ([actualTitle, actualName, actualDescription]) => {
                const pass =
                  actualTitle === 'Super Hero' &&
                  isTitleCased(actualName) &&
                  actualDescription.length > 0;

                const actualHero = `Hero(${actualTitle}, ${actualName}, ${actualDescription})`;
                result.message = `Expected ${actualHero}'${pass ? ' not' : ''} to be a real hero.`;

                return pass;
              },
            ),
        };
        return result;
      },
    }),
    toHaveName: () => ({
      compare(actualNg1Hero: ElementFinder | undefined, expectedName: string) {
        const result = {
          message: 'Expected undefined to be an `ng1Hero` ElementFinder.',
          pass:
            !!actualNg1Hero &&
            actualNg1Hero
              .element(by.css('h2'))
              .getText()
              .then((actualName) => {
                const pass = actualName === expectedName;
                result.message = `Expected Hero(${actualName})${
                  pass ? ' not' : ''
                } to have name '${expectedName}'.`;
                return pass;
              }),
        };
        return result;
      },
    }),
  } as any);
}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// #docplaster
import {
  Component,
  Directive,
  ElementRef,
  getPlatform,
  Injectable,
  Injector,
  NgModule,
  StaticProvider,
} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {
  downgradeComponent,
  downgradeInjectable,
  downgradeModule,
  UpgradeComponent,
} from '@angular/upgrade/static';

declare var angular: ng.IAngularStatic;

// An Angular module that declares an Angular service and a component,
// which in turn uses an upgraded AngularJS component.
@Component({
  selector: 'ng2A',
  template: 'Component A | <ng1A></ng1A>',
})
export class Ng2AComponent {}

@Directive({
  selector: 'ng1A',
})
export class Ng1AComponentFacade extends UpgradeComponent {
  constructor(elementRef: ElementRef, injector: Injector) {
    super('ng1A', elementRef, injector);
  }
}

@Injectable()
export class Ng2AService {
  getValue() {
    return 'ng2';
  }
}

@NgModule({
  imports: [BrowserModule],
  providers: [Ng2AService],
  declarations: [Ng1AComponentFacade, Ng2AComponent],
})
export class Ng2AModule {
  ngDoBootstrap() {}
}

// Another Angular module that declares an Angular component.
@Component({
  selector: 'ng2B',
  template: 'Component B',
})
export class Ng2BComponent {}

@NgModule({
  imports: [BrowserModule],
  declarations: [Ng2BComponent],
})
export class Ng2BModule {
  ngDoBootstrap() {}
}

// The downgraded Angular modules.
const downgradedNg2AModule = downgradeModule((extraProviders: StaticProvider[]) =>
  (getPlatform() || platformBrowserDynamic(extraProviders)).bootstrapModule(Ng2AModule),
);

const downgradedNg2BModule = downgradeModule((extraProviders: StaticProvider[]) =>
  (getPlatform() || platformBrowserDynamic(extraProviders)).bootstrapModule(Ng2BModule),
);

// The AngularJS app including downgraded modules, components and injectables.
const appModule = angular
  .module('exampleAppModule', [downgradedNg2AModule, downgradedNg2BModule])
  .component('exampleApp', {
    template: `
        <nav>
          <button ng-click="$ctrl.page = page" ng-repeat="page in ['A', 'B']">
            Page {{ page }}
          </button>
        </nav>
        <hr />
        <main ng-switch="$ctrl.page">
          <ng2-a ng-switch-when="A"></ng2-a>
          <ng2-b ng-switch-when="B"></ng2-b>
        </main>
      `,
    controller: class ExampleAppController {
      page = 'A';
    },
  })
  .component('ng1A', {
    template: 'ng1({{ $ctrl.value }})',
    controller: [
      'ng2AService',
      class Ng1AController {
        value = this.ng2AService.getValue();
        constructor(private ng2AService: Ng2AService) {}
      },
    ],
  })
  .directive(
    'ng2A',
    downgradeComponent({
      component: Ng2AComponent,
      // Since there is more than one downgraded Angular module,
      // specify which module this component belongs to.
      downgradedModule: downgradedNg2AModule,
      propagateDigest: false,
    }),
  )
  .directive(
    'ng2B',
    downgradeComponent({
      component: Ng2BComponent,
      // Since there is more than one downgraded Angular module,
      // specify which module this component belongs to.
      downgradedModule: downgradedNg2BModule,
      propagateDigest: false,
    }),
  )
  .factory('ng2AService', downgradeInjectable(Ng2AService, downgradedNg2AModule));

// Bootstrap the AngularJS app.
angular.bootstrap(document.body, [appModule.name]);

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {browser, by, element} from 'protractor';

import {verifyNoBrowserErrors} from '../../../../../test-utils';

describe('upgrade/static (lite with multiple downgraded modules)', () => {
  const navButtons = element.all(by.css('nav button'));
  const mainContent = element(by.css('main'));

  beforeEach(() => browser.get('/'));
  afterEach(verifyNoBrowserErrors);

  it('should correctly bootstrap multiple downgraded modules', () => {
    navButtons.get(1).click();
    expect(mainContent.getText()).toBe('Component B');

    navButtons.get(0).click();
    expect(mainContent.getText()).toBe('Component A | ng1(ng2)');
  });
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  Compiler,
  Component,
  getPlatform,
  Injectable,
  Injector,
  NgModule,
  StaticProvider,
} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {downgradeComponent, downgradeModule} from '@angular/upgrade/static';

declare var angular: ng.IAngularStatic;

// An Angular service provided in root. Each instance of the service will get a new ID.
@Injectable({providedIn: 'root'})
export class Ng2Service {
  static nextId = 1;
  id = Ng2Service.nextId++;
}

// An Angular module that will act as "root" for all downgraded modules, so that injectables
// provided in root will be available to all.
@NgModule({
  imports: [BrowserModule],
})
export class Ng2RootModule {
  ngDoBootstrap() {}
}

// An Angular module that declares an Angular component,
// which in turn uses an Angular service from the root module.
@Component({
  selector: 'ng2A',
  template: 'Component A (Service ID: {{ service.id }})',
})
export class Ng2AComponent {
  constructor(public service: Ng2Service) {}
}

@NgModule({
  declarations: [Ng2AComponent],
})
export class Ng2AModule {
  ngDoBootstrap() {}
}

// Another Angular module that declares an Angular component, which uses the same service.
@Component({
  selector: 'ng2B',
  template: 'Component B (Service ID: {{ service.id }})',
})
export class Ng2BComponent {
  constructor(public service: Ng2Service) {}
}

@NgModule({
  declarations: [Ng2BComponent],
})
export class Ng2BModule {
  ngDoBootstrap() {}
}

// A third Angular module that declares an Angular component, which uses the same service.
@Component({
  selector: 'ng2C',
  template: 'Component C (Service ID: {{ service.id }})',
})
export class Ng2CComponent {
  constructor(public service: Ng2Service) {}
}

@NgModule({
  imports: [BrowserModule],
  declarations: [Ng2CComponent],
})
export class Ng2CModule {
  ngDoBootstrap() {}
}

// The downgraded Angular modules. Modules A and B share a common root module. Module C does not.
// #docregion shared-root-module
let rootInjectorPromise: Promise<Injector> | null = null;
const getRootInjector = (extraProviders: StaticProvider[]) => {
  if (!rootInjectorPromise) {
    rootInjectorPromise = platformBrowserDynamic(extraProviders)
      .bootstrapModule(Ng2RootModule)
      .then((moduleRef) => moduleRef.injector);
  }
  return rootInjectorPromise;
};

const downgradedNg2AModule = downgradeModule(async (extraProviders: StaticProvider[]) => {
  const rootInjector = await getRootInjector(extraProviders);
  const moduleAFactory = await rootInjector.get(Compiler).compileModuleAsync(Ng2AModule);
  return moduleAFactory.create(rootInjector);
});
const downgradedNg2BModule = downgradeModule(async (extraProviders: StaticProvider[]) => {
  const rootInjector = await getRootInjector(extraProviders);
  const moduleBFactory = await rootInjector.get(Compiler).compileModuleAsync(Ng2BModule);
  return moduleBFactory.create(rootInjector);
});
// #enddocregion shared-root-module

const downgradedNg2CModule = downgradeModule((extraProviders: StaticProvider[]) =>
  (getPlatform() || platformBrowserDynamic(extraProviders)).bootstrapModule(Ng2CModule),
);

// The AngularJS app including downgraded modules and components.
// #docregion shared-root-module
const appModule = angular
  .module('exampleAppModule', [downgradedNg2AModule, downgradedNg2BModule, downgradedNg2CModule])
  // #enddocregion shared-root-module
  .component('exampleApp', {template: '<ng2-a></ng2-a> | <ng2-b></ng2-b> | <ng2-c></ng2-c>'})
  .directive(
    'ng2A',
    downgradeComponent({
      component: Ng2AComponent,
      // Since there is more than one downgraded Angular module,
      // specify which module this component belongs to.
      downgradedModule: downgradedNg2AModule,
      propagateDigest: false,
    }),
  )
  .directive(
    'ng2B',
    downgradeComponent({
      component: Ng2BComponent,
      // Since there is more than one downgraded Angular module,
      // specify which module this component belongs to.
      downgradedModule: downgradedNg2BModule,
      propagateDigest: false,
    }),
  )
  .directive(
    'ng2C',
    downgradeComponent({
      component: Ng2CComponent,
      // Since there is more than one downgraded Angular module,
      // specify which module this component belongs to.
      downgradedModule: downgradedNg2CModule,
      propagateDigest: false,
    }),
  );

// Bootstrap the AngularJS app.
angular.bootstrap(document.body, [appModule.name]);

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {browser, by, element} from 'protractor';

import {verifyNoBrowserErrors} from '../../../../../test-utils';

describe('upgrade/static (lite with multiple downgraded modules and shared root module)', () => {
  const compA = element(by.css('ng2-a'));
  const compB = element(by.css('ng2-b'));
  const compC = element(by.css('ng2-c'));

  beforeEach(() => browser.get('/'));
  afterEach(verifyNoBrowserErrors);

  it('should share the same injectable instance across downgraded modules A and B', () => {
    expect(compA.getText()).toBe('Component A (Service ID: 2)');
    expect(compB.getText()).toBe('Component B (Service ID: 2)');
  });

  it('should use a different injectable instance on downgraded module C', () => {
    expect(compC.getText()).toBe('Component C (Service ID: 1)');
  });
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import 'zone.js/lib/browser/rollup-main';

import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {TestsAppModule} from './test_module';

platformBrowserDynamic().bootstrapModule(TestsAppModule);

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component, NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';

import * as formBuilderExample from './ts/formBuilder/module';
import * as nestedFormArrayExample from './ts/nestedFormArray/module';
import * as nestedFormGroupExample from './ts/nestedFormGroup/module';
import * as ngModelGroupExample from './ts/ngModelGroup/module';
import * as radioButtonsExample from './ts/radioButtons/module';
import * as reactiveRadioButtonsExample from './ts/reactiveRadioButtons/module';
import * as reactiveSelectControlExample from './ts/reactiveSelectControl/module';
import * as selectControlExample from './ts/selectControl/module';
import * as simpleFormExample from './ts/simpleForm/module';
import * as simpleFormControlExample from './ts/simpleFormControl/module';
import * as simpleFormGroupExample from './ts/simpleFormGroup/module';
import * as simpleNgModelExample from './ts/simpleNgModel/module';

@Component({selector: 'example-app', template: '<router-outlet></router-outlet>'})
export class TestsAppComponent {}

@NgModule({
  imports: [
    formBuilderExample.AppModule,
    nestedFormArrayExample.AppModule,
    nestedFormGroupExample.AppModule,
    ngModelGroupExample.AppModule,
    radioButtonsExample.AppModule,
    reactiveRadioButtonsExample.AppModule,
    reactiveSelectControlExample.AppModule,
    selectControlExample.AppModule,
    simpleFormExample.AppModule,
    simpleFormControlExample.AppModule,
    simpleFormGroupExample.AppModule,
    simpleNgModelExample.AppModule,

    // Router configuration so that the individual e2e tests can load their
    // app components.
    RouterModule.forRoot([
      {path: 'formBuilder', component: formBuilderExample.AppComponent},
      {path: 'nestedFormArray', component: nestedFormArrayExample.AppComponent},
      {path: 'nestedFormGroup', component: nestedFormGroupExample.AppComponent},
      {path: 'ngModelGroup', component: ngModelGroupExample.AppComponent},
      {path: 'radioButtons', component: radioButtonsExample.AppComponent},
      {path: 'reactiveRadioButtons', component: reactiveRadioButtonsExample.AppComponent},
      {path: 'reactiveSelectControl', component: reactiveSelectControlExample.AppComponent},
      {path: 'selectControl', component: selectControlExample.AppComponent},
      {path: 'simpleForm', component: simpleFormExample.AppComponent},
      {path: 'simpleFormControl', component: simpleFormControlExample.AppComponent},
      {path: 'simpleFormGroup', component: simpleFormGroupExample.AppComponent},
      {path: 'simpleNgModel', component: simpleNgModelExample.AppComponent},
    ]),
  ],
  declarations: [TestsAppComponent],
  bootstrap: [TestsAppComponent],
})
export class TestsAppModule {}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {NgModelGroupComp} from './ng_model_group_example';

@NgModule({
  imports: [BrowserModule, FormsModule],
  declarations: [NgModelGroupComp],
  bootstrap: [NgModelGroupComp],
})
export class AppModule {}

export {NgModelGroupComp as AppComponent};

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {browser, by, element, ElementArrayFinder} from 'protractor';

import {verifyNoBrowserErrors} from '../../../../test-utils';

describe('ngModelGroup example', () => {
  afterEach(verifyNoBrowserErrors);
  let inputs: ElementArrayFinder;
  let buttons: ElementArrayFinder;

  beforeEach(() => {
    browser.get('/ngModelGroup');
    inputs = element.all(by.css('input'));
    buttons = element.all(by.css('button'));
  });

  it('should populate the UI with initial values', () => {
    expect(inputs.get(0).getAttribute('value')).toEqual('Nancy');
    expect(inputs.get(1).getAttribute('value')).toEqual('J');
    expect(inputs.get(2).getAttribute('value')).toEqual('Drew');
  });

  it('should show the error when name is invalid', () => {
    inputs.get(0).click();
    inputs.get(0).clear();
    inputs.get(0).sendKeys('a');

    expect(element(by.css('p')).getText()).toEqual('Name is invalid.');
  });

  it('should set the value when changing the domain model', () => {
    buttons.get(1).click();
    expect(inputs.get(0).getAttribute('value')).toEqual('Bess');
    expect(inputs.get(1).getAttribute('value')).toEqual('S');
    expect(inputs.get(2).getAttribute('value')).toEqual('Marvin');
  });
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/* tslint:disable:no-console  */
// #docregion Component
import {Component} from '@angular/core';
import {NgForm} from '@angular/forms';

@Component({
  selector: 'example-app',
  template: `
    <form #f="ngForm" (ngSubmit)="onSubmit(f)">
      <p *ngIf="nameCtrl.invalid">Name is invalid.</p>

      <div ngModelGroup="name" #nameCtrl="ngModelGroup">
        <input name="first" [ngModel]="name.first" minlength="2" />
        <input name="middle" [ngModel]="name.middle" maxlength="2" />
        <input name="last" [ngModel]="name.last" required />
      </div>

      <input name="email" ngModel />
      <button>Submit</button>
    </form>

    <button (click)="setValue()">Set value</button>
  `,
})
export class NgModelGroupComp {
  name = {first: 'Nancy', middle: 'J', last: 'Drew'};

  onSubmit(f: NgForm) {
    console.log(f.value); // {name: {first: 'Nancy', middle: 'J', last: 'Drew'}, email: ''}
    console.log(f.valid); // true
  }

  setValue() {
    this.name = {first: 'Bess', middle: 'S', last: 'Marvin'};
  }
}
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// #docregion Component
import {Component} from '@angular/core';
import {FormControl, Validators} from '@angular/forms';

@Component({
  selector: 'example-app',
  template: `
    <input [formControl]="control" />

    <p>Value: {{ control.value }}</p>
    <p>Validation status: {{ control.status }}</p>

    <button (click)="setValue()">Set value</button>
  `,
})
export class SimpleFormControl {
  control: FormControl = new FormControl('value', Validators.minLength(2));

  setValue() {
    this.control.setValue('new value');
  }
}
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {SimpleFormControl} from './simple_form_control_example';

@NgModule({
  imports: [BrowserModule, ReactiveFormsModule],
  declarations: [SimpleFormControl],
  bootstrap: [SimpleFormControl],
})
export class AppModule {}

export {SimpleFormControl as AppComponent};

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {browser, by, element, ElementFinder} from 'protractor';

import {verifyNoBrowserErrors} from '../../../../test-utils';

describe('simpleFormControl example', () => {
  afterEach(verifyNoBrowserErrors);

  describe('index view', () => {
    let input: ElementFinder;
    let valueP: ElementFinder;
    let statusP: ElementFinder;

    beforeEach(() => {
      browser.get('/simpleFormControl');
      input = element(by.css('input'));
      valueP = element(by.css('p:first-of-type'));
      statusP = element(by.css('p:last-of-type'));
    });

    it('should populate the form control value in the DOM', () => {
      expect(input.getAttribute('value')).toEqual('value');
      expect(valueP.getText()).toEqual('Value: value');
    });

    it('should update the value as user types', () => {
      input.click();
      input.sendKeys('s!');

      expect(valueP.getText()).toEqual('Value: values!');
    });

    it('should show the correct validity state', () => {
      expect(statusP.getText()).toEqual('Validation status: VALID');

      input.click();
      input.clear();
      input.sendKeys('a');
      expect(statusP.getText()).toEqual('Validation status: INVALID');
    });

    it('should set the value programmatically', () => {
      element(by.css('button')).click();
      expect(input.getAttribute('value')).toEqual('new value');
    });
  });
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {ReactiveRadioButtonComp} from './reactive_radio_button_example';

@NgModule({
  imports: [BrowserModule, ReactiveFormsModule],
  declarations: [ReactiveRadioButtonComp],
  bootstrap: [ReactiveRadioButtonComp],
})
export class AppModule {}

export {ReactiveRadioButtonComp as AppComponent};

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// #docregion Reactive
import {Component} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';

@Component({
  selector: 'example-app',
  template: `
    <form [formGroup]="form">
      <input type="radio" formControlName="food" value="beef" />
      Beef
      <input type="radio" formControlName="food" value="lamb" />
      Lamb
      <input type="radio" formControlName="food" value="fish" />
      Fish
    </form>

    <p>Form value: {{ form.value | json }}</p>
    <!-- {food: 'lamb' } -->
  `,
})
export class ReactiveRadioButtonComp {
  form = new FormGroup({
    food: new FormControl('lamb'),
  });
}
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {browser, by, element, ElementArrayFinder} from 'protractor';

import {verifyNoBrowserErrors} from '../../../../test-utils';

describe('radioButtons example', () => {
  afterEach(verifyNoBrowserErrors);
  let inputs: ElementArrayFinder;

  beforeEach(() => {
    browser.get('/reactiveRadioButtons');
    inputs = element.all(by.css('input'));
  });

  it('should populate the UI with initial values', () => {
    expect(inputs.get(0).getAttribute('checked')).toEqual(null);
    expect(inputs.get(1).getAttribute('checked')).toEqual('true');
    expect(inputs.get(2).getAttribute('checked')).toEqual(null);

    expect(element(by.css('p')).getText()).toEqual('Form value: { "food": "lamb" }');
  });

  it('update model and other buttons as the UI value changes', () => {
    inputs.get(0).click();

    expect(inputs.get(0).getAttribute('checked')).toEqual('true');
    expect(inputs.get(1).getAttribute('checked')).toEqual(null);
    expect(inputs.get(2).getAttribute('checked')).toEqual(null);

    expect(element(by.css('p')).getText()).toEqual('Form value: { "food": "beef" }');
  });
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {DisabledFormControlComponent, FormBuilderComp} from './form_builder_example';

@NgModule({
  imports: [BrowserModule, ReactiveFormsModule],
  declarations: [FormBuilderComp, DisabledFormControlComponent],
  bootstrap: [FormBuilderComp],
})
export class AppModule {}

export {FormBuilderComp as AppComponent};

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {browser, by, element, ElementArrayFinder} from 'protractor';

import {verifyNoBrowserErrors} from '../../../../test-utils';

describe('formBuilder example', () => {
  afterEach(verifyNoBrowserErrors);
  let inputs: ElementArrayFinder;
  let paragraphs: ElementArrayFinder;

  beforeEach(() => {
    browser.get('/formBuilder');
    inputs = element.all(by.css('input'));
    paragraphs = element.all(by.css('p'));
  });

  it('should populate the UI with initial values', () => {
    expect(inputs.get(0).getAttribute('value')).toEqual('Nancy');
    expect(inputs.get(1).getAttribute('value')).toEqual('Drew');
  });

  it('should update the validation status', () => {
    expect(paragraphs.get(1).getText()).toEqual('Validation status: VALID');

    inputs.get(0).click();
    inputs.get(0).clear();
    inputs.get(0).sendKeys('a');
    expect(paragraphs.get(1).getText()).toEqual('Validation status: INVALID');
  });
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// #docregion disabled-control
import {Component, Inject} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
// #enddocregion disabled-control

@Component({
  selector: 'example-app',
  template: `
    <form [formGroup]="form">
      <div formGroupName="name">
        <input formControlName="first" placeholder="First" />
        <input formControlName="last" placeholder="Last" />
      </div>
      <input formControlName="email" placeholder="Email" />
      <button>Submit</button>
    </form>

    <p>Value: {{ form.value | json }}</p>
    <p>Validation status: {{ form.status }}</p>
  `,
})
export class FormBuilderComp {
  form: FormGroup;

  constructor(@Inject(FormBuilder) formBuilder: FormBuilder) {
    this.form = formBuilder.group(
      {
        name: formBuilder.group({
          first: ['Nancy', Validators.minLength(2)],
          last: 'Drew',
        }),
        email: '',
      },
      {updateOn: 'change'},
    );
  }
}

// #docregion disabled-control
@Component({
  selector: 'app-disabled-form-control',
  template: `
    <input [formControl]="control" placeholder="First" />
  `,
})
export class DisabledFormControlComponent {
  control: FormControl;

  constructor(private formBuilder: FormBuilder) {
    this.control = formBuilder.control({value: 'my val', disabled: true});
  }
}
// #enddocregion disabled-control

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {NestedFormArray} from './nested_form_array_example';

@NgModule({
  imports: [BrowserModule, ReactiveFormsModule],
  declarations: [NestedFormArray],
  bootstrap: [NestedFormArray],
})
export class AppModule {}

export {NestedFormArray as AppComponent};

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/* tslint:disable:no-console  */
// #docregion Component
import {Component} from '@angular/core';
import {FormArray, FormControl, FormGroup} from '@angular/forms';

@Component({
  selector: 'example-app',
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div formArrayName="cities">
        <div *ngFor="let city of cities.controls; index as i">
          <input [formControlName]="i" placeholder="City" />
        </div>
      </div>
      <button>Submit</button>
    </form>

    <button (click)="addCity()">Add City</button>
    <button (click)="setPreset()">Set preset</button>
  `,
})
export class NestedFormArray {
  form = new FormGroup({
    cities: new FormArray([new FormControl('SF'), new FormControl('NY')]),
  });

  get cities(): FormArray {
    return this.form.get('cities') as FormArray;
  }

  addCity() {
    this.cities.push(new FormControl());
  }

  onSubmit() {
    console.log(this.cities.value); // ['SF', 'NY']
    console.log(this.form.value); // { cities: ['SF', 'NY'] }
  }

  setPreset() {
    this.cities.patchValue(['LA', 'MTV']);
  }
}
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {browser, by, element, ElementArrayFinder} from 'protractor';

import {verifyNoBrowserErrors} from '../../../../test-utils';

describe('nestedFormArray example', () => {
  afterEach(verifyNoBrowserErrors);
  let inputs: ElementArrayFinder;
  let buttons: ElementArrayFinder;

  beforeEach(() => {
    browser.get('/nestedFormArray');
    inputs = element.all(by.css('input'));
    buttons = element.all(by.css('button'));
  });

  it('should populate the UI with initial values', () => {
    expect(inputs.get(0).getAttribute('value')).toEqual('SF');
    expect(inputs.get(1).getAttribute('value')).toEqual('NY');
  });

  it('should add inputs programmatically', () => {
    expect(inputs.count()).toBe(2);

    buttons.get(1).click();
    inputs = element.all(by.css('input'));

    expect(inputs.count()).toBe(3);
  });

  it('should set the value programmatically', () => {
    buttons.get(2).click();
    expect(inputs.get(0).getAttribute('value')).toEqual('LA');
    expect(inputs.get(1).getAttribute('value')).toEqual('MTV');
  });
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {SimpleFormGroup} from './simple_form_group_example';

@NgModule({
  imports: [BrowserModule, ReactiveFormsModule],
  declarations: [SimpleFormGroup],
  bootstrap: [SimpleFormGroup],
})
export class AppModule {}

export {SimpleFormGroup as AppComponent};

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/* tslint:disable:no-console  */
// #docregion Component
import {Component} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: 'example-app',
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div *ngIf="first.invalid">Name is too short.</div>

      <input formControlName="first" placeholder="First name" />
      <input formControlName="last" placeholder="Last name" />

      <button type="submit">Submit</button>
    </form>
    <button (click)="setValue()">Set preset value</button>
  `,
})
export class SimpleFormGroup {
  form = new FormGroup({
    first: new FormControl('Nancy', Validators.minLength(2)),
    last: new FormControl('Drew'),
  });

  get first(): any {
    return this.form.get('first');
  }

  onSubmit(): void {
    console.log(this.form.value); // {first: 'Nancy', last: 'Drew'}
  }

  setValue() {
    this.form.setValue({first: 'Carson', last: 'Drew'});
  }
}

// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {browser, by, element, ElementFinder} from 'protractor';

import {verifyNoBrowserErrors} from '../../../../test-utils';

describe('formControlName example', () => {
  afterEach(verifyNoBrowserErrors);

  describe('index view', () => {
    let firstInput: ElementFinder;
    let lastInput: ElementFinder;

    beforeEach(() => {
      browser.get('/simpleFormGroup');
      firstInput = element(by.css('[formControlName="first"]'));
      lastInput = element(by.css('[formControlName="last"]'));
    });

    it('should populate the form control values in the DOM', () => {
      expect(firstInput.getAttribute('value')).toEqual('Nancy');
      expect(lastInput.getAttribute('value')).toEqual('Drew');
    });

    it('should show the error when the form is invalid', () => {
      firstInput.click();
      firstInput.clear();
      firstInput.sendKeys('a');

      expect(element(by.css('div')).getText()).toEqual('Name is too short.');
    });

    it('should set the value programmatically', () => {
      element(by.css('button:not([type="submit"])')).click();
      expect(firstInput.getAttribute('value')).toEqual('Carson');
      expect(lastInput.getAttribute('value')).toEqual('Drew');
    });
  });
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {SelectControlComp} from './select_control_example';

@NgModule({
  imports: [BrowserModule, FormsModule],
  declarations: [SelectControlComp],
  bootstrap: [SelectControlComp],
})
export class AppModule {}

export {SelectControlComp as AppComponent};

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {browser, by, element, ElementArrayFinder, ElementFinder} from 'protractor';

import {verifyNoBrowserErrors} from '../../../../test-utils';

describe('selectControl example', () => {
  afterEach(verifyNoBrowserErrors);
  let select: ElementFinder;
  let options: ElementArrayFinder;
  let p: ElementFinder;

  beforeEach(() => {
    browser.get('/selectControl');
    select = element(by.css('select'));
    options = element.all(by.css('option'));
    p = element(by.css('p'));
  });

  it('should initially select the placeholder option', () => {
    expect(options.get(0).getAttribute('selected')).toBe('true');
  });

  it('should update the model when the value changes in the UI', () => {
    select.click();
    options.get(1).click();

    expect(p.getText()).toEqual('Form value: { "state": { "name": "Arizona", "abbrev": "AZ" } }');
  });
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// #docregion Component
import {Component} from '@angular/core';

@Component({
  selector: 'example-app',
  template: `
    <form #f="ngForm">
      <select name="state" ngModel>
        <option value="" disabled>Choose a state</option>
        <option *ngFor="let state of states" [ngValue]="state">
          {{ state.abbrev }}
        </option>
      </select>
    </form>

    <p>Form value: {{ f.value | json }}</p>
    <!-- example value: {state: {name: 'New York', abbrev: 'NY'} } -->
  `,
})
export class SelectControlComp {
  states = [
    {name: 'Arizona', abbrev: 'AZ'},
    {name: 'California', abbrev: 'CA'},
    {name: 'Colorado', abbrev: 'CO'},
    {name: 'New York', abbrev: 'NY'},
    {name: 'Pennsylvania', abbrev: 'PA'},
  ];
}
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {ReactiveSelectComp} from './reactive_select_control_example';

@NgModule({
  imports: [BrowserModule, ReactiveFormsModule],
  declarations: [ReactiveSelectComp],
  bootstrap: [ReactiveSelectComp],
})
export class AppModule {}

export {ReactiveSelectComp as AppComponent};

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {browser, by, element, ElementArrayFinder, ElementFinder} from 'protractor';

import {verifyNoBrowserErrors} from '../../../../test-utils';

describe('reactiveSelectControl example', () => {
  afterEach(verifyNoBrowserErrors);
  let select: ElementFinder;
  let options: ElementArrayFinder;
  let p: ElementFinder;

  beforeEach(() => {
    browser.get('/reactiveSelectControl');
    select = element(by.css('select'));
    options = element.all(by.css('option'));
    p = element(by.css('p'));
  });

  it('should populate the initial selection', () => {
    expect(select.getAttribute('value')).toEqual('3: Object');
    expect(options.get(3).getAttribute('selected')).toBe('true');
  });

  it('should update the model when the value changes in the UI', () => {
    select.click();
    options.get(0).click();

    expect(p.getText()).toEqual('Form value: { "state": { "name": "Arizona", "abbrev": "AZ" } }');
  });
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// #docregion Component
import {Component} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';

@Component({
  selector: 'example-app',
  template: `
    <form [formGroup]="form">
      <select formControlName="state">
        <option *ngFor="let state of states" [ngValue]="state">
          {{ state.abbrev }}
        </option>
      </select>
    </form>

    <p>Form value: {{ form.value | json }}</p>
    <!-- {state: {name: 'New York', abbrev: 'NY'} } -->
  `,
})
export class ReactiveSelectComp {
  states = [
    {name: 'Arizona', abbrev: 'AZ'},
    {name: 'California', abbrev: 'CA'},
    {name: 'Colorado', abbrev: 'CO'},
    {name: 'New York', abbrev: 'NY'},
    {name: 'Pennsylvania', abbrev: 'PA'},
  ];

  form = new FormGroup({
    state: new FormControl(this.states[3]),
  });
}
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {RadioButtonComp} from './radio_button_example';

@NgModule({
  imports: [BrowserModule, FormsModule],
  declarations: [RadioButtonComp],
  bootstrap: [RadioButtonComp],
})
export class AppModule {}

export {RadioButtonComp as AppComponent};

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {Component} from '@angular/core';

@Component({
  selector: 'example-app',
  template: `
    <form #f="ngForm">
      <input type="radio" value="beef" name="food" [(ngModel)]="myFood" />
      Beef
      <input type="radio" value="lamb" name="food" [(ngModel)]="myFood" />
      Lamb
      <input type="radio" value="fish" name="food" [(ngModel)]="myFood" />
      Fish
    </form>

    <p>Form value: {{ f.value | json }}</p>
    <!-- {food: 'lamb' } -->
    <p>myFood value: {{ myFood }}</p>
    <!-- 'lamb' -->
  `,
})
export class RadioButtonComp {
  myFood = 'lamb';
}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {browser, by, element, ElementArrayFinder} from 'protractor';

import {verifyNoBrowserErrors} from '../../../../test-utils';

describe('radioButtons example', () => {
  afterEach(verifyNoBrowserErrors);
  let inputs: ElementArrayFinder;
  let paragraphs: ElementArrayFinder;

  beforeEach(() => {
    browser.get('/radioButtons');
    inputs = element.all(by.css('input'));
    paragraphs = element.all(by.css('p'));
  });

  it('should populate the UI with initial values', () => {
    expect(inputs.get(0).getAttribute('checked')).toEqual(null);
    expect(inputs.get(1).getAttribute('checked')).toEqual('true');
    expect(inputs.get(2).getAttribute('checked')).toEqual(null);

    expect(paragraphs.get(0).getText()).toEqual('Form value: { "food": "lamb" }');
    expect(paragraphs.get(1).getText()).toEqual('myFood value: lamb');
  });

  it('update model and other buttons as the UI value changes', () => {
    inputs.get(0).click();

    expect(inputs.get(0).getAttribute('checked')).toEqual('true');
    expect(inputs.get(1).getAttribute('checked')).toEqual(null);
    expect(inputs.get(2).getAttribute('checked')).toEqual(null);

    expect(paragraphs.get(0).getText()).toEqual('Form value: { "food": "beef" }');
    expect(paragraphs.get(1).getText()).toEqual('myFood value: beef');
  });
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {SimpleNgModelComp} from './simple_ng_model_example';

@NgModule({
  imports: [BrowserModule, FormsModule],
  declarations: [SimpleNgModelComp],
  bootstrap: [SimpleNgModelComp],
})
export class AppModule {}

export {SimpleNgModelComp as AppComponent};

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// #docregion Component
import {Component} from '@angular/core';

@Component({
  selector: 'example-app',
  template: `
    <input [(ngModel)]="name" #ctrl="ngModel" required />

    <p>Value: {{ name }}</p>
    <p>Valid: {{ ctrl.valid }}</p>

    <button (click)="setValue()">Set value</button>
  `,
})
export class SimpleNgModelComp {
  name: string = '';

  setValue() {
    this.name = 'Nancy';
  }
}
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {browser, by, element, ElementArrayFinder, ElementFinder} from 'protractor';

import {verifyNoBrowserErrors} from '../../../../test-utils';

describe('simpleNgModel example', () => {
  afterEach(verifyNoBrowserErrors);
  let input: ElementFinder;
  let paragraphs: ElementArrayFinder;
  let button: ElementFinder;

  beforeEach(() => {
    browser.get('/simpleNgModel');
    input = element(by.css('input'));
    paragraphs = element.all(by.css('p'));
    button = element(by.css('button'));
  });

  it('should update the domain model as you type', () => {
    input.click();
    input.sendKeys('Carson');

    expect(paragraphs.get(0).getText()).toEqual('Value: Carson');
  });

  it('should report the validity correctly', () => {
    expect(paragraphs.get(1).getText()).toEqual('Valid: false');
    input.click();
    input.sendKeys('a');

    expect(paragraphs.get(1).getText()).toEqual('Valid: true');
  });

  it('should set the value by changing the domain model', () => {
    button.click();
    expect(input.getAttribute('value')).toEqual('Nancy');
  });
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {SimpleFormComp} from './simple_form_example';

@NgModule({
  imports: [BrowserModule, FormsModule],
  declarations: [SimpleFormComp],
  bootstrap: [SimpleFormComp],
})
export class AppModule {}

export {SimpleFormComp as AppComponent};

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/* tslint:disable:no-console  */
// #docregion Component
import {Component} from '@angular/core';
import {NgForm} from '@angular/forms';

@Component({
  selector: 'example-app',
  template: `
    <form #f="ngForm" (ngSubmit)="onSubmit(f)" novalidate>
      <input name="first" ngModel required #first="ngModel" />
      <input name="last" ngModel />
      <button>Submit</button>
    </form>

    <p>First name value: {{ first.value }}</p>
    <p>First name valid: {{ first.valid }}</p>
    <p>Form value: {{ f.value | json }}</p>
    <p>Form valid: {{ f.valid }}</p>
  `,
})
export class SimpleFormComp {
  onSubmit(f: NgForm) {
    console.log(f.value); // { first: '', last: '' }
    console.log(f.valid); // false
  }
}
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {browser, by, element, ElementArrayFinder} from 'protractor';

import {verifyNoBrowserErrors} from '../../../../test-utils';

describe('simpleForm example', () => {
  afterEach(verifyNoBrowserErrors);
  let inputs: ElementArrayFinder;
  let paragraphs: ElementArrayFinder;

  beforeEach(() => {
    browser.get('/simpleForm');
    inputs = element.all(by.css('input'));
    paragraphs = element.all(by.css('p'));
  });

  it('should update the domain model as you type', () => {
    inputs.get(0).click();
    inputs.get(0).sendKeys('Nancy');

    inputs.get(1).click();
    inputs.get(1).sendKeys('Drew');

    expect(paragraphs.get(0).getText()).toEqual('First name value: Nancy');
    expect(paragraphs.get(2).getText()).toEqual('Form value: { "first": "Nancy", "last": "Drew" }');
  });

  it('should report the validity correctly', () => {
    expect(paragraphs.get(1).getText()).toEqual('First name valid: false');
    expect(paragraphs.get(3).getText()).toEqual('Form valid: false');
    inputs.get(0).click();
    inputs.get(0).sendKeys('a');

    expect(paragraphs.get(1).getText()).toEqual('First name valid: true');
    expect(paragraphs.get(3).getText()).toEqual('Form valid: true');
  });
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {NestedFormGroupComp} from './nested_form_group_example';

@NgModule({
  imports: [BrowserModule, ReactiveFormsModule],
  declarations: [NestedFormGroupComp],
  bootstrap: [NestedFormGroupComp],
})
export class AppModule {}

export {NestedFormGroupComp as AppComponent};

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {browser, by, element, ElementFinder} from 'protractor';

import {verifyNoBrowserErrors} from '../../../../test-utils';

describe('nestedFormGroup example', () => {
  afterEach(verifyNoBrowserErrors);
  let firstInput: ElementFinder;
  let lastInput: ElementFinder;
  let button: ElementFinder;

  beforeEach(() => {
    browser.get('/nestedFormGroup');
    firstInput = element(by.css('[formControlName="first"]'));
    lastInput = element(by.css('[formControlName="last"]'));
    button = element(by.css('button:not([type="submit"])'));
  });

  it('should populate the UI with initial values', () => {
    expect(firstInput.getAttribute('value')).toEqual('Nancy');
    expect(lastInput.getAttribute('value')).toEqual('Drew');
  });

  it('should show the error when name is invalid', () => {
    firstInput.click();
    firstInput.clear();
    firstInput.sendKeys('a');

    expect(element(by.css('p')).getText()).toEqual('Name is invalid.');
  });

  it('should set the value programmatically', () => {
    button.click();
    expect(firstInput.getAttribute('value')).toEqual('Bess');
    expect(lastInput.getAttribute('value')).toEqual('Marvin');
  });
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/* tslint:disable:no-console  */
// #docregion Component
import {Component} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: 'example-app',
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <p *ngIf="name.invalid">Name is invalid.</p>

      <div formGroupName="name">
        <input formControlName="first" placeholder="First name" />
        <input formControlName="last" placeholder="Last name" />
      </div>
      <input formControlName="email" placeholder="Email" />
      <button type="submit">Submit</button>
    </form>

    <button (click)="setPreset()">Set preset</button>
  `,
})
export class NestedFormGroupComp {
  form = new FormGroup({
    name: new FormGroup({
      first: new FormControl('Nancy', Validators.minLength(2)),
      last: new FormControl('Drew', Validators.required),
    }),
    email: new FormControl(),
  });

  get first(): any {
    return this.form.get('name.first');
  }

  get name(): any {
    return this.form.get('name');
  }

  onSubmit() {
    console.log(this.first.value); // 'Nancy'
    console.log(this.name.value); // {first: 'Nancy', last: 'Drew'}
    console.log(this.form.value); // {name: {first: 'Nancy', last: 'Drew'}, email: ''}
    console.log(this.form.status); // VALID
  }

  setPreset() {
    this.name.setValue({first: 'Bess', last: 'Marvin'});
  }
}
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {forwardRef, Inject, Injectable, Injector, resolveForwardRef} from '@angular/core';

{
  describe('forwardRef examples', () => {
    it('ForwardRefFn example works', () => {
      // #docregion forward_ref_fn
      const ref = forwardRef(() => Lock);
      // #enddocregion
      expect(ref).not.toBeNull();

      class Lock {}
    });

    it('can be used to inject a class defined later', () => {
      // #docregion forward_ref
      @Injectable()
      class Door {
        lock: Lock;

        // Door attempts to inject Lock, despite it not being defined yet.
        // forwardRef makes this possible.
        constructor(@Inject(forwardRef(() => Lock)) lock: Lock) {
          this.lock = lock;
        }
      }

      // Only at this point Lock is defined.
      class Lock {}

      const injector = Injector.create({
        providers: [
          {provide: Lock, deps: []},
          {provide: Door, deps: [Lock]},
        ],
      });

      expect(injector.get(Door) instanceof Door).toBe(true);
      expect(injector.get(Door).lock instanceof Lock).toBe(true);
      // #enddocregion
    });

    it('can be unwrapped', () => {
      // #docregion resolve_forward_ref
      const ref = forwardRef(() => 'refValue');
      expect(resolveForwardRef(ref as any)).toEqual('refValue');
      expect(resolveForwardRef('regularValue')).toEqual('regularValue');
      // #enddocregion
    });
  });
}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// #docregion HowTo
import {AfterContentInit, ContentChild, Directive} from '@angular/core';

@Directive({selector: 'child-directive'})
class ChildDirective {}

@Directive({selector: 'someDir'})
class SomeDir implements AfterContentInit {
  @ContentChild(ChildDirective) contentChild!: ChildDirective;

  ngAfterContentInit() {
    // contentChild is set
  }
}
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {ContentChildComp, Pane, Tab} from './content_child_example';

@NgModule({
  imports: [BrowserModule],
  declarations: [ContentChildComp, Pane, Tab],
  bootstrap: [ContentChildComp],
})
export class AppModule {}

export {ContentChildComp as AppComponent};

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {browser, by, element, ElementFinder} from 'protractor';

import {verifyNoBrowserErrors} from '../../../../../test-utils';

describe('contentChild example', () => {
  afterEach(verifyNoBrowserErrors);
  let button: ElementFinder;
  let result: ElementFinder;

  beforeEach(() => {
    browser.get('/di/contentChild');
    button = element(by.css('button'));
    result = element(by.css('div'));
  });

  it('should query content child', () => {
    expect(result.getText()).toEqual('pane: 1');

    button.click();

    expect(result.getText()).toEqual('pane: 2');
  });
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// #docregion Component
import {Component, ContentChild, Directive, Input} from '@angular/core';

@Directive({selector: 'pane'})
export class Pane {
  @Input() id!: string;
}

@Component({
  selector: 'tab',
  template: `
    <div>pane: {{ pane?.id }}</div>
  `,
})
export class Tab {
  @ContentChild(Pane) pane!: Pane;
}

@Component({
  selector: 'example-app',
  template: `
    <tab>
      <pane id="1" *ngIf="shouldShow"></pane>
      <pane id="2" *ngIf="!shouldShow"></pane>
    </tab>

    <button (click)="toggle()">Toggle</button>
  `,
})
export class ContentChildComp {
  shouldShow = true;

  toggle() {
    this.shouldShow = !this.shouldShow;
  }
}
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  Component,
  Directive,
  Host,
  Injectable,
  Injector,
  Optional,
  Self,
  SkipSelf,
} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';

{
  describe('di metadata examples', () => {
    describe('Inject', () => {
      it('works without decorator', () => {
        // #docregion InjectWithoutDecorator
        class Engine {}

        @Injectable()
        class Car {
          constructor(public engine: Engine) {} // same as constructor(@Inject(Engine) engine:Engine)
        }

        const injector = Injector.create({
          providers: [
            {provide: Engine, deps: []},
            {provide: Car, deps: [Engine]},
          ],
        });
        expect(injector.get(Car).engine instanceof Engine).toBe(true);
        // #enddocregion
      });
    });

    describe('Optional', () => {
      it('works', () => {
        // #docregion Optional
        class Engine {}

        @Injectable()
        class Car {
          constructor(@Optional() public engine: Engine) {}
        }

        const injector = Injector.create({
          providers: [{provide: Car, deps: [[new Optional(), Engine]]}],
        });
        expect(injector.get(Car).engine).toBeNull();
        // #enddocregion
      });
    });

    describe('Injectable', () => {
      it('works', () => {
        // #docregion Injectable
        @Injectable()
        class UsefulService {}

        @Injectable()
        class NeedsService {
          constructor(public service: UsefulService) {}
        }

        const injector = Injector.create({
          providers: [
            {provide: NeedsService, deps: [UsefulService]},
            {provide: UsefulService, deps: []},
          ],
        });
        expect(injector.get(NeedsService).service instanceof UsefulService).toBe(true);
        // #enddocregion
      });
    });

    describe('Self', () => {
      it('works', () => {
        // #docregion Self
        class Dependency {}

        @Injectable()
        class NeedsDependency {
          constructor(@Self() public dependency: Dependency) {}
        }

        let inj = Injector.create({
          providers: [
            {provide: Dependency, deps: []},
            {provide: NeedsDependency, deps: [[new Self(), Dependency]]},
          ],
        });
        const nd = inj.get(NeedsDependency);

        expect(nd.dependency instanceof Dependency).toBe(true);

        const child = Injector.create({
          providers: [{provide: NeedsDependency, deps: [[new Self(), Dependency]]}],
          parent: inj,
        });
        expect(() => child.get(NeedsDependency)).toThrowError();
        // #enddocregion
      });
    });

    describe('SkipSelf', () => {
      it('works', () => {
        // #docregion SkipSelf
        class Dependency {}

        @Injectable()
        class NeedsDependency {
          constructor(@SkipSelf() public dependency: Dependency) {}
        }

        const parent = Injector.create({providers: [{provide: Dependency, deps: []}]});
        const child = Injector.create({
          providers: [{provide: NeedsDependency, deps: [Dependency]}],
          parent,
        });
        expect(child.get(NeedsDependency).dependency instanceof Dependency).toBe(true);

        const inj = Injector.create({
          providers: [{provide: NeedsDependency, deps: [[new Self(), Dependency]]}],
        });
        expect(() => inj.get(NeedsDependency)).toThrowError();
        // #enddocregion
      });
    });

    describe('Host', () => {
      it('works', () => {
        // #docregion Host
        class OtherService {}
        class HostService {}

        @Directive({selector: 'child-directive'})
        class ChildDirective {
          logs: string[] = [];

          constructor(@Optional() @Host() os: OtherService, @Optional() @Host() hs: HostService) {
            // os is null: true
            this.logs.push(`os is null: ${os === null}`);
            // hs is an instance of HostService: true
            this.logs.push(`hs is an instance of HostService: ${hs instanceof HostService}`);
          }
        }

        @Component({
          selector: 'parent-cmp',
          viewProviders: [HostService],
          template: '<child-directive></child-directive>',
        })
        class ParentCmp {}

        @Component({
          selector: 'app',
          viewProviders: [OtherService],
          template: '<parent-cmp></parent-cmp>',
        })
        class App {}
        // #enddocregion

        TestBed.configureTestingModule({
          declarations: [App, ParentCmp, ChildDirective],
        });

        let cmp: ComponentFixture<App> = undefined!;
        expect(() => (cmp = TestBed.createComponent(App))).not.toThrow();

        expect(cmp.debugElement.children[0].children[0].injector.get(ChildDirective).logs).toEqual([
          'os is null: true',
          'hs is an instance of HostService: true',
        ]);
      });
    });
  });
}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {Pane, ViewChildComp} from './view_child_example';

@NgModule({
  imports: [BrowserModule],
  declarations: [ViewChildComp, Pane],
  bootstrap: [ViewChildComp],
})
export class AppModule {}

export {ViewChildComp as AppComponent};

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// #docregion Component
import {Component, Directive, Input, ViewChild} from '@angular/core';

@Directive({selector: 'pane'})
export class Pane {
  @Input() id!: string;
}

@Component({
  selector: 'example-app',
  template: `
    <pane id="1" *ngIf="shouldShow"></pane>
    <pane id="2" *ngIf="!shouldShow"></pane>

    <button (click)="toggle()">Toggle</button>

    <div>Selected: {{ selectedPane }}</div>
  `,
})
export class ViewChildComp {
  @ViewChild(Pane)
  set pane(v: Pane) {
    setTimeout(() => {
      this.selectedPane = v.id;
    }, 0);
  }
  selectedPane: string = '';
  shouldShow = true;
  toggle() {
    this.shouldShow = !this.shouldShow;
  }
}
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {browser, by, element, ElementFinder} from 'protractor';

import {verifyNoBrowserErrors} from '../../../../../test-utils';

describe('viewChild example', () => {
  afterEach(verifyNoBrowserErrors);
  let button: ElementFinder;
  let result: ElementFinder;

  beforeEach(() => {
    browser.get('/di/viewChild');
    button = element(by.css('button'));
    result = element(by.css('div'));
  });

  it('should query view child', () => {
    expect(result.getText()).toEqual('Selected: 1');

    button.click();

    expect(result.getText()).toEqual('Selected: 2');
  });
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// #docregion HowTo
import {AfterViewInit, Component, Directive, ViewChild} from '@angular/core';

@Directive({selector: 'child-directive'})
class ChildDirective {}

@Component({selector: 'someCmp', templateUrl: 'someCmp.html'})
class SomeCmp implements AfterViewInit {
  @ViewChild(ChildDirective) child!: ChildDirective;

  ngAfterViewInit() {
    // child is set
  }
}
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  inject,
  InjectFlags,
  InjectionToken,
  InjectOptions,
  Injector,
  ProviderToken,
  ɵsetCurrentInjector as setCurrentInjector,
  ɵsetInjectorProfilerContext,
} from '@angular/core';

class MockRootScopeInjector implements Injector {
  constructor(readonly parent: Injector) {}

  get<T>(
    token: ProviderToken<T>,
    defaultValue?: any,
    flags: InjectFlags | InjectOptions = InjectFlags.Default,
  ): T {
    if ((token as any).ɵprov && (token as any).ɵprov.providedIn === 'root') {
      const old = setCurrentInjector(this);
      const previousInjectorProfilerContext = ɵsetInjectorProfilerContext({
        injector: this,
        token: null,
      });
      try {
        return (token as any).ɵprov.factory();
      } finally {
        setCurrentInjector(old);
        ɵsetInjectorProfilerContext(previousInjectorProfilerContext);
      }
    }
    return this.parent.get(token, defaultValue, flags);
  }
}

{
  describe('injector metadata examples', () => {
    it('works', () => {
      // #docregion Injector
      const injector: Injector = Injector.create({
        providers: [{provide: 'validToken', useValue: 'Value'}],
      });
      expect(injector.get('validToken')).toEqual('Value');
      expect(() => injector.get('invalidToken')).toThrowError();
      expect(injector.get('invalidToken', 'notFound')).toEqual('notFound');
      // #enddocregion
    });

    it('injects injector', () => {
      // #docregion injectInjector
      const injector = Injector.create({providers: []});
      expect(injector.get(Injector)).toBe(injector);
      // #enddocregion
    });

    it('should infer type', () => {
      // #docregion InjectionToken
      const BASE_URL = new InjectionToken<string>('BaseUrl');
      const injector = Injector.create({
        providers: [{provide: BASE_URL, useValue: 'http://localhost'}],
      });
      const url = injector.get(BASE_URL);
      // Note: since `BASE_URL` is `InjectionToken<string>`
      // `url` is correctly inferred to be `string`
      expect(url).toBe('http://localhost');
      // #enddocregion
    });

    it('injects a tree-shakeable InjectionToken', () => {
      class MyDep {}
      const injector = new MockRootScopeInjector(
        Injector.create({providers: [{provide: MyDep, deps: []}]}),
      );

      // #docregion ShakableInjectionToken
      class MyService {
        constructor(readonly myDep: MyDep) {}
      }

      const MY_SERVICE_TOKEN = new InjectionToken<MyService>('Manually constructed MyService', {
        providedIn: 'root',
        factory: () => new MyService(inject(MyDep)),
      });

      const instance = injector.get(MY_SERVICE_TOKEN);
      expect(instance instanceof MyService).toBeTruthy();
      expect(instance.myDep instanceof MyDep).toBeTruthy();
      // #enddocregion
    });
  });
}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {ContentChildrenComp, Pane, Tab} from './content_children_example';

@NgModule({
  imports: [BrowserModule],
  declarations: [ContentChildrenComp, Pane, Tab],
  bootstrap: [ContentChildrenComp],
})
export class AppModule {}

export {ContentChildrenComp as AppComponent};

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// #docregion Component
import {Component, ContentChildren, Directive, Input, QueryList} from '@angular/core';

@Directive({selector: 'pane'})
export class Pane {
  @Input() id!: string;
}

@Component({
  selector: 'tab',
  template: `
    <div class="top-level">Top level panes: {{ serializedPanes }}</div>
    <div class="nested">Arbitrary nested panes: {{ serializedNestedPanes }}</div>
  `,
})
export class Tab {
  @ContentChildren(Pane) topLevelPanes!: QueryList<Pane>;
  @ContentChildren(Pane, {descendants: true}) arbitraryNestedPanes!: QueryList<Pane>;

  get serializedPanes(): string {
    return this.topLevelPanes ? this.topLevelPanes.map((p) => p.id).join(', ') : '';
  }
  get serializedNestedPanes(): string {
    return this.arbitraryNestedPanes ? this.arbitraryNestedPanes.map((p) => p.id).join(', ') : '';
  }
}

@Component({
  selector: 'example-app',
  template: `
    <tab>
      <pane id="1"></pane>
      <pane id="2"></pane>
      <pane id="3" *ngIf="shouldShow">
        <tab>
          <pane id="3_1"></pane>
          <pane id="3_2"></pane>
        </tab>
      </pane>
    </tab>

    <button (click)="show()">Show 3</button>
  `,
})
export class ContentChildrenComp {
  shouldShow = false;

  show() {
    this.shouldShow = true;
  }
}
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {browser, by, element, ElementFinder} from 'protractor';

import {verifyNoBrowserErrors} from '../../../../../test-utils';

describe('contentChildren example', () => {
  afterEach(verifyNoBrowserErrors);
  let button: ElementFinder;
  let resultTopLevel: ElementFinder;
  let resultNested: ElementFinder;

  beforeEach(() => {
    browser.get('/di/contentChildren');
    button = element(by.css('button'));
    resultTopLevel = element(by.css('.top-level'));
    resultNested = element(by.css('.nested'));
  });

  it('should query content children', () => {
    expect(resultTopLevel.getText()).toEqual('Top level panes: 1, 2');

    button.click();

    expect(resultTopLevel.getText()).toEqual('Top level panes: 1, 2, 3');
  });

  it('should query nested content children', () => {
    expect(resultNested.getText()).toEqual('Arbitrary nested panes: 1, 2');

    button.click();

    expect(resultNested.getText()).toEqual('Arbitrary nested panes: 1, 2, 3, 3_1, 3_2');
  });
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// #docregion HowTo
import {AfterContentInit, ContentChildren, Directive, QueryList} from '@angular/core';

@Directive({selector: 'child-directive'})
class ChildDirective {}

@Directive({selector: 'someDir'})
class SomeDir implements AfterContentInit {
  @ContentChildren(ChildDirective) contentChildren!: QueryList<ChildDirective>;

  ngAfterContentInit() {
    // contentChildren is set
  }
}
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Injectable, InjectionToken, Injector, Optional} from '@angular/core';

{
  describe('Provider examples', () => {
    describe('TypeProvider', () => {
      it('works', () => {
        // #docregion TypeProvider
        @Injectable()
        class Greeting {
          salutation = 'Hello';
        }

        const injector = Injector.create({providers: [{provide: Greeting, useClass: Greeting}]});

        expect(injector.get(Greeting).salutation).toBe('Hello');
        // #enddocregion
      });
    });

    describe('ValueProvider', () => {
      it('works', () => {
        // #docregion ValueProvider
        const injector = Injector.create({providers: [{provide: String, useValue: 'Hello'}]});

        expect(injector.get(String)).toEqual('Hello');
        // #enddocregion
      });
    });

    describe('MultiProviderAspect', () => {
      it('works', () => {
        // #docregion MultiProviderAspect
        const locale = new InjectionToken<string[]>('locale');
        const injector = Injector.create({
          providers: [
            {provide: locale, multi: true, useValue: 'en'},
            {provide: locale, multi: true, useValue: 'sk'},
          ],
        });

        const locales: string[] = injector.get(locale);
        expect(locales).toEqual(['en', 'sk']);
        // #enddocregion
      });
    });

    describe('ClassProvider', () => {
      it('works', () => {
        // #docregion ClassProvider
        abstract class Shape {
          name!: string;
        }

        class Square extends Shape {
          override name = 'square';
        }

        const injector = Injector.create({providers: [{provide: Shape, useValue: new Square()}]});

        const shape: Shape = injector.get(Shape);
        expect(shape.name).toEqual('square');
        expect(shape instanceof Square).toBe(true);
        // #enddocregion
      });

      it('is different then useExisting', () => {
        // #docregion ClassProviderDifference
        class Greeting {
          salutation = 'Hello';
        }

        class FormalGreeting extends Greeting {
          override salutation = 'Greetings';
        }

        const injector = Injector.create({
          providers: [
            {provide: FormalGreeting, useClass: FormalGreeting},
            {provide: Greeting, useClass: FormalGreeting},
          ],
        });

        // The injector returns different instances.
        // See: {provide: ?, useExisting: ?} if you want the same instance.
        expect(injector.get(FormalGreeting)).not.toBe(injector.get(Greeting));
        // #enddocregion
      });
    });

    describe('StaticClassProvider', () => {
      it('works', () => {
        // #docregion StaticClassProvider
        abstract class Shape {
          name!: string;
        }

        class Square extends Shape {
          override name = 'square';
        }

        const injector = Injector.create({
          providers: [{provide: Shape, useClass: Square, deps: []}],
        });

        const shape: Shape = injector.get(Shape);
        expect(shape.name).toEqual('square');
        expect(shape instanceof Square).toBe(true);
        // #enddocregion
      });

      it('is different then useExisting', () => {
        // #docregion StaticClassProviderDifference
        class Greeting {
          salutation = 'Hello';
        }

        class FormalGreeting extends Greeting {
          override salutation = 'Greetings';
        }

        const injector = Injector.create({
          providers: [
            {provide: FormalGreeting, useClass: FormalGreeting, deps: []},
            {provide: Greeting, useClass: FormalGreeting, deps: []},
          ],
        });

        // The injector returns different instances.
        // See: {provide: ?, useExisting: ?} if you want the same instance.
        expect(injector.get(FormalGreeting)).not.toBe(injector.get(Greeting));
        // #enddocregion
      });
    });

    describe('ConstructorProvider', () => {
      it('works', () => {
        // #docregion ConstructorProvider
        class Square {
          name = 'square';
        }

        const injector = Injector.create({providers: [{provide: Square, deps: []}]});

        const shape: Square = injector.get(Square);
        expect(shape.name).toEqual('square');
        expect(shape instanceof Square).toBe(true);
        // #enddocregion
      });
    });

    describe('ExistingProvider', () => {
      it('works', () => {
        // #docregion ExistingProvider
        class Greeting {
          salutation = 'Hello';
        }

        class FormalGreeting extends Greeting {
          override salutation = 'Greetings';
        }

        const injector = Injector.create({
          providers: [
            {provide: FormalGreeting, deps: []},
            {provide: Greeting, useExisting: FormalGreeting},
          ],
        });

        expect(injector.get(Greeting).salutation).toEqual('Greetings');
        expect(injector.get(FormalGreeting).salutation).toEqual('Greetings');
        expect(injector.get(FormalGreeting)).toBe(injector.get(Greeting));
        // #enddocregion
      });
    });

    describe('FactoryProvider', () => {
      it('works', () => {
        // #docregion FactoryProvider
        const Location = new InjectionToken('location');
        const Hash = new InjectionToken('hash');

        const injector = Injector.create({
          providers: [
            {provide: Location, useValue: 'https://angular.io/#someLocation'},
            {
              provide: Hash,
              useFactory: (location: string) => location.split('#')[1],
              deps: [Location],
            },
          ],
        });

        expect(injector.get(Hash)).toEqual('someLocation');
        // #enddocregion
      });

      it('supports optional dependencies', () => {
        // #docregion FactoryProviderOptionalDeps
        const Location = new InjectionToken('location');
        const Hash = new InjectionToken('hash');

        const injector = Injector.create({
          providers: [
            {
              provide: Hash,
              useFactory: (location: string) => `Hash for: ${location}`,
              // use a nested array to define metadata for dependencies.
              deps: [[new Optional(), Location]],
            },
          ],
        });

        expect(injector.get(Hash)).toEqual('Hash for: null');
        // #enddocregion
      });
    });
  });
}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// #docregion HowTo
import {AfterViewInit, Component, Directive, QueryList, ViewChildren} from '@angular/core';

@Directive({selector: 'child-directive'})
class ChildDirective {}

@Component({selector: 'someCmp', templateUrl: 'someCmp.html'})
class SomeCmp implements AfterViewInit {
  @ViewChildren(ChildDirective) viewChildren!: QueryList<ChildDirective>;

  ngAfterViewInit() {
    // viewChildren is set
  }
}
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {Pane, ViewChildrenComp} from './view_children_example';

@NgModule({
  imports: [BrowserModule],
  declarations: [ViewChildrenComp, Pane],
  bootstrap: [ViewChildrenComp],
})
export class AppModule {}

export {ViewChildrenComp as AppComponent};

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// #docregion Component
import {AfterViewInit, Component, Directive, Input, QueryList, ViewChildren} from '@angular/core';

@Directive({selector: 'pane'})
export class Pane {
  @Input() id!: string;
}

@Component({
  selector: 'example-app',
  template: `
    <pane id="1"></pane>
    <pane id="2"></pane>
    <pane id="3" *ngIf="shouldShow"></pane>

    <button (click)="show()">Show 3</button>

    <div>panes: {{ serializedPanes }}</div>
  `,
})
export class ViewChildrenComp implements AfterViewInit {
  @ViewChildren(Pane) panes!: QueryList<Pane>;
  serializedPanes: string = '';

  shouldShow = false;

  show() {
    this.shouldShow = true;
  }

  ngAfterViewInit() {
    this.calculateSerializedPanes();
    this.panes.changes.subscribe((r) => {
      this.calculateSerializedPanes();
    });
  }

  calculateSerializedPanes() {
    setTimeout(() => {
      this.serializedPanes = this.panes.map((p) => p.id).join(', ');
    }, 0);
  }
}
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {browser, by, element, ElementFinder} from 'protractor';

import {verifyNoBrowserErrors} from '../../../../../test-utils';

describe('viewChildren example', () => {
  afterEach(verifyNoBrowserErrors);
  let button: ElementFinder;
  let result: ElementFinder;

  beforeEach(() => {
    browser.get('/di/viewChildren');
    button = element(by.css('button'));
    result = element(by.css('div'));
  });

  it('should query view children', () => {
    expect(result.getText()).toEqual('panes: 1, 2');

    button.click();

    expect(result.getText()).toEqual('panes: 1, 2, 3');
  });
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import 'zone.js/lib/browser/rollup-main';
import 'zone.js/lib/zone-spec/task-tracking';

// okd

import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {TestsAppModule} from './test_module';

platformBrowserDynamic().bootstrapModule(TestsAppModule);

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

@Component({
  selector: 'example-app',
  template: `
    <button class="start-button" (click)="start()">Start long-running task</button>
    <div class="status">Status: {{ status }}</div>
  `,
})
export class StableTestCmp {
  status = 'none';
  start() {
    this.status = 'running';
    setTimeout(() => {
      this.status = 'done';
    }, 5000);
  }
}

@NgModule({imports: [BrowserModule], declarations: [StableTestCmp], bootstrap: [StableTestCmp]})
export class AppModule {}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export {AppModule, StableTestCmp as AppComponent} from './testability_example';

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {browser, by, element} from 'protractor';
import {verifyNoBrowserErrors} from '../../../../../test-utils';

// Declare the global "window" and "document" constant since we don't want to add the "dom"
// TypeScript lib for the e2e specs that execute code in the browser and reference such
// global constants.
declare const window: any;
declare const document: any;

describe('testability example', () => {
  afterEach(verifyNoBrowserErrors);

  describe('using task tracking', () => {
    const URL = '/testability/whenStable/';

    it('times out with a list of tasks', (done) => {
      browser.get(URL);
      browser.ignoreSynchronization = true;

      // Script that runs in the browser and calls whenStable with a timeout.
      let waitWithResultScript = function (done: any) {
        let rootEl = document.querySelector('example-app');
        let testability = window.getAngularTestability(rootEl);
        testability.whenStable(() => {
          done();
        }, 1000);
      };

      element(by.css('.start-button')).click();

      browser.driver.executeAsyncScript(waitWithResultScript).then(() => {
        expect(element(by.css('.status')).getText()).not.toContain('done');
        done();
      });
    });

    afterAll(() => {
      browser.ignoreSynchronization = false;
    });
  });
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

export {AppModule, MyExpandoCmp as AppComponent} from './animation_example';

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {animate, state, style, transition, trigger} from '@angular/animations';
import {Component, NgModule} from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

@Component({
  selector: 'example-app',
  styles: [
    `
      .toggle-container {
        background-color: white;
        border: 10px solid black;
        width: 200px;
        text-align: center;
        line-height: 100px;
        font-size: 50px;
        box-sizing: border-box;
        overflow: hidden;
      }
    `,
  ],
  animations: [
    trigger('openClose', [
      state('collapsed, void', style({height: '0px', color: 'maroon', borderColor: 'maroon'})),
      state('expanded', style({height: '*', borderColor: 'green', color: 'green'})),
      transition('collapsed <=> expanded', [animate(500, style({height: '250px'})), animate(500)]),
    ]),
  ],
  template: `
    <button (click)="expand()">Open</button>
    <button (click)="collapse()">Closed</button>
    <hr />
    <div class="toggle-container" [@openClose]="stateExpression">Look at this box</div>
  `,
})
export class MyExpandoCmp {
  // TODO(issue/24571): remove '!'.
  stateExpression!: string;
  constructor() {
    this.collapse();
  }
  expand() {
    this.stateExpression = 'expanded';
  }
  collapse() {
    this.stateExpression = 'collapsed';
  }
}

@NgModule({
  imports: [BrowserAnimationsModule],
  declarations: [MyExpandoCmp],
  bootstrap: [MyExpandoCmp],
})
export class AppModule {}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {$, browser, by, element, ExpectedConditions} from 'protractor';

import {verifyNoBrowserErrors} from '../../../../../test-utils';

function waitForElement(selector: string) {
  const EC = ExpectedConditions;
  // Waits for the element with id 'abc' to be present on the dom.
  browser.wait(EC.presenceOf($(selector)), 20000);
}

describe('animation example', () => {
  afterEach(verifyNoBrowserErrors);

  describe('index view', () => {
    const URL = '/animation/dsl/';

    it('should list out the current collection of items', () => {
      browser.get(URL);
      waitForElement('.toggle-container');
      expect(element.all(by.css('.toggle-container')).get(0).getText()).toEqual('Look at this box');
    });
  });
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {discardPeriodicTasks, fakeAsync, tick} from '@angular/core/testing';

// #docregion basic
describe('this test', () => {
  it(
    'looks async but is synchronous',
    <any>fakeAsync((): void => {
      let flag = false;
      setTimeout(() => {
        flag = true;
      }, 100);
      expect(flag).toBe(false);
      tick(50);
      expect(flag).toBe(false);
      tick(50);
      expect(flag).toBe(true);
    }),
  );
});
// #enddocregion

describe('this test', () => {
  it(
    'aborts a periodic timer',
    <any>fakeAsync((): void => {
      // This timer is scheduled but doesn't need to complete for the
      // test to pass (maybe it's a timeout for some operation).
      // Leaving it will cause the test to fail...
      setInterval(() => {}, 100);

      // Unless we clean it up first.
      discardPeriodicTasks();
    }),
  );
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// Import the "fake_async" example that registers tests which are shown as examples. These need
// to be valid tests, so we run them here. Note that we need to add this layer of abstraction here
// because the "jasmine_node_test" rule only picks up test files with the "_spec.ts" file suffix.
import './fake_async';

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component, NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';

import * as animationDslExample from './animation/ts/dsl/module';
import * as diContentChildExample from './di/ts/contentChild/module';
import * as diContentChildrenExample from './di/ts/contentChildren/module';
import * as diViewChildExample from './di/ts/viewChild/module';
import * as diViewChildrenExample from './di/ts/viewChildren/module';
import * as testabilityWhenStableExample from './testability/ts/whenStable/module';

@Component({selector: 'example-app', template: '<router-outlet></router-outlet>'})
export class TestsAppComponent {}

@NgModule({
  imports: [
    animationDslExample.AppModule,
    diContentChildExample.AppModule,
    diContentChildrenExample.AppModule,
    diViewChildExample.AppModule,
    diViewChildrenExample.AppModule,
    testabilityWhenStableExample.AppModule,

    // Router configuration so that the individual e2e tests can load their
    // app components.
    RouterModule.forRoot([
      {path: 'animation/dsl', component: animationDslExample.AppComponent},
      {path: 'di/contentChild', component: diContentChildExample.AppComponent},
      {path: 'di/contentChildren', component: diContentChildrenExample.AppComponent},
      {path: 'di/viewChild', component: diViewChildExample.AppComponent},
      {path: 'di/viewChildren', component: diViewChildrenExample.AppComponent},
      {path: 'testability/whenStable', component: testabilityWhenStableExample.AppComponent},
    ]),
  ],
  declarations: [TestsAppComponent],
  bootstrap: [TestsAppComponent],
})
export class TestsAppModule {}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component} from '@angular/core';

@Component({selector: 'my-component', template: '<h1>My Component</h1>'})
export class MyComponent {}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {enableProdMode, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {MyComponent} from './my_component';

enableProdMode();

@NgModule({imports: [BrowserModule], declarations: [MyComponent], bootstrap: [MyComponent]})
export class AppModule {}

platformBrowserDynamic().bootstrapModule(AppModule);

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

@Component({selector: 'app-root', template: 'Hello {{ name }}!'})
class MyApp {
  name: string = 'World';
}

@NgModule({imports: [BrowserModule], bootstrap: [MyApp]})
class AppModule {}

export function main() {
  platformBrowserDynamic().bootstrapModule(AppModule);
}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ApplicationRef, Component, DoBootstrap, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  template: `
    <h1>Component One</h1>
  `,
})
export class ComponentOne {}

@Component({
  selector: 'app-root',
  template: `
    <h1>Component Two</h1>
  `,
})
export class ComponentTwo {}

@Component({
  selector: 'app-root',
  template: `
    <h1>Component Three</h1>
  `,
})
export class ComponentThree {}

@Component({
  selector: 'app-root',
  template: `
    <h1>Component Four</h1>
  `,
})
export class ComponentFour {}

@NgModule({imports: [BrowserModule], declarations: [ComponentOne, ComponentTwo]})
export class AppModule implements DoBootstrap {
  // #docregion componentSelector
  ngDoBootstrap(appRef: ApplicationRef) {
    this.fetchDataFromApi().then((componentName: string) => {
      if (componentName === 'ComponentOne') {
        appRef.bootstrap(ComponentOne);
      } else {
        appRef.bootstrap(ComponentTwo);
      }
    });
  }
  // #enddocregion

  fetchDataFromApi(): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('ComponentTwo');
      }, 2000);
    });
  }
}

@NgModule({imports: [BrowserModule], declarations: [ComponentThree]})
export class AppModuleTwo implements DoBootstrap {
  // #docregion cssSelector
  ngDoBootstrap(appRef: ApplicationRef) {
    appRef.bootstrap(ComponentThree, '#root-element');
  }
  // #enddocregion cssSelector
}

@NgModule({imports: [BrowserModule], declarations: [ComponentFour]})
export class AppModuleThree implements DoBootstrap {
  // #docregion domNode
  ngDoBootstrap(appRef: ApplicationRef) {
    const element = document.querySelector('#root-element');
    appRef.bootstrap(ComponentFour, element);
  }
  // #enddocregion domNode
}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NgModule} from '@angular/core';
import {TruncatePipe as SimpleTruncatePipe} from './simple_truncate';
import {TruncatePipe} from './truncate';

@NgModule({declarations: [SimpleTruncatePipe, TruncatePipe]})
export class TruncateModule {}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// #docregion
import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'truncate'})
export class TruncatePipe implements PipeTransform {
  transform(value: string, length: number, symbol: string) {
    return value.split(' ').slice(0, length).join(' ') + symbol;
  }
}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// #docregion
import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'truncate'})
export class TruncatePipe implements PipeTransform {
  transform(value: string) {
    return value.split(' ').slice(0, 2).join(' ') + '...';
  }
}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/* tslint:disable:no-console  */
import {Component, Directive, EventEmitter, NgModule} from '@angular/core';

// #docregion component-input
@Component({
  selector: 'app-bank-account',
  inputs: ['bankName', 'id: account-id'],
  template: `
    Bank Name: {{ bankName }} Account Id: {{ id }}
  `,
})
export class BankAccountComponent {
  bankName: string | null = null;
  id: string | null = null;

  // this property is not bound, and won't be automatically updated by Angular
  normalizedBankName: string | null = null;
}

@Component({
  selector: 'app-my-input',
  template: `
    <app-bank-account bankName="RBC" account-id="4747"></app-bank-account>
  `,
})
export class MyInputComponent {}
// #enddocregion component-input

// #docregion component-output-interval
@Directive({selector: 'app-interval-dir', outputs: ['everySecond', 'fiveSecs: everyFiveSeconds']})
export class IntervalDirComponent {
  everySecond = new EventEmitter<string>();
  fiveSecs = new EventEmitter<string>();

  constructor() {
    setInterval(() => this.everySecond.emit('event'), 1000);
    setInterval(() => this.fiveSecs.emit('event'), 5000);
  }
}

@Component({
  selector: 'app-my-output',
  template: `
    <app-interval-dir
      (everySecond)="onEverySecond()"
      (everyFiveSeconds)="onEveryFiveSeconds()"
    ></app-interval-dir>
  `,
})
export class MyOutputComponent {
  onEverySecond() {
    console.log('second');
  }
  onEveryFiveSeconds() {
    console.log('five seconds');
  }
}
// #enddocregion component-output-interval

@NgModule({
  declarations: [BankAccountComponent, MyInputComponent, IntervalDirComponent, MyOutputComponent],
})
export class AppModule {}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Attribute, Component, Directive, Pipe} from '@angular/core';

class CustomDirective {}

@Component({selector: 'greet', template: 'Hello {{name}}!'})
class Greet {
  name: string = 'World';
}

// #docregion attributeFactory
@Component({selector: 'page', template: 'Title: {{title}}'})
class Page {
  title: string;
  constructor(@Attribute('title') title: string) {
    this.title = title;
  }
}
// #enddocregion

// #docregion attributeMetadata
@Directive({selector: 'input'})
class InputAttrDirective {
  constructor(@Attribute('type') type: string) {
    // type would be 'text' in this example
  }
}
// #enddocregion

@Directive({selector: 'input'})
class InputDirective {
  constructor() {
    // Add some logic.
  }
}

@Pipe({name: 'lowercase'})
class Lowercase {
  transform(v: string, args: any[]) {
    return v.toLowerCase();
  }
}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  AfterContentChecked,
  AfterContentInit,
  AfterViewChecked,
  AfterViewInit,
  Component,
  DoCheck,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  Type,
} from '@angular/core';
import {TestBed} from '@angular/core/testing';

(function () {
  describe('lifecycle hooks examples', () => {
    it('should work with ngOnInit', () => {
      // #docregion OnInit
      @Component({
        selector: 'my-cmp',
        template: `
          ...
        `,
      })
      class MyComponent implements OnInit {
        ngOnInit() {
          // ...
        }
      }
      // #enddocregion

      expect(createAndLogComponent(MyComponent)).toEqual([['ngOnInit', []]]);
    });

    it('should work with ngDoCheck', () => {
      // #docregion DoCheck
      @Component({
        selector: 'my-cmp',
        template: `
          ...
        `,
      })
      class MyComponent implements DoCheck {
        ngDoCheck() {
          // ...
        }
      }
      // #enddocregion

      expect(createAndLogComponent(MyComponent)).toEqual([['ngDoCheck', []]]);
    });

    it('should work with ngAfterContentChecked', () => {
      // #docregion AfterContentChecked
      @Component({
        selector: 'my-cmp',
        template: `
          ...
        `,
      })
      class MyComponent implements AfterContentChecked {
        ngAfterContentChecked() {
          // ...
        }
      }
      // #enddocregion

      expect(createAndLogComponent(MyComponent)).toEqual([['ngAfterContentChecked', []]]);
    });

    it('should work with ngAfterContentInit', () => {
      // #docregion AfterContentInit
      @Component({
        selector: 'my-cmp',
        template: `
          ...
        `,
      })
      class MyComponent implements AfterContentInit {
        ngAfterContentInit() {
          // ...
        }
      }
      // #enddocregion

      expect(createAndLogComponent(MyComponent)).toEqual([['ngAfterContentInit', []]]);
    });

    it('should work with ngAfterViewChecked', () => {
      // #docregion AfterViewChecked
      @Component({
        selector: 'my-cmp',
        template: `
          ...
        `,
      })
      class MyComponent implements AfterViewChecked {
        ngAfterViewChecked() {
          // ...
        }
      }
      // #enddocregion

      expect(createAndLogComponent(MyComponent)).toEqual([['ngAfterViewChecked', []]]);
    });

    it('should work with ngAfterViewInit', () => {
      // #docregion AfterViewInit
      @Component({
        selector: 'my-cmp',
        template: `
          ...
        `,
      })
      class MyComponent implements AfterViewInit {
        ngAfterViewInit() {
          // ...
        }
      }
      // #enddocregion

      expect(createAndLogComponent(MyComponent)).toEqual([['ngAfterViewInit', []]]);
    });

    it('should work with ngOnDestroy', () => {
      // #docregion OnDestroy
      @Component({
        selector: 'my-cmp',
        template: `
          ...
        `,
      })
      class MyComponent implements OnDestroy {
        ngOnDestroy() {
          // ...
        }
      }
      // #enddocregion

      expect(createAndLogComponent(MyComponent)).toEqual([['ngOnDestroy', []]]);
    });

    it('should work with ngOnChanges', () => {
      // #docregion OnChanges
      @Component({
        selector: 'my-cmp',
        template: `
          ...
        `,
      })
      class MyComponent implements OnChanges {
        @Input() prop: number = 0;

        ngOnChanges(changes: SimpleChanges) {
          // changes.prop contains the old and the new value...
        }
      }
      // #enddocregion

      const log = createAndLogComponent(MyComponent, ['prop']);
      expect(log.length).toBe(1);
      expect(log[0][0]).toBe('ngOnChanges');
      const changes: SimpleChanges = log[0][1][0];
      expect(changes['prop'].currentValue).toBe(true);
    });
  });

  function createAndLogComponent(clazz: Type<any>, inputs: string[] = []): any[] {
    const log: any[] = [];
    createLoggingSpiesFromProto(clazz, log);

    const inputBindings = inputs.map((input) => `[${input}] = true`).join(' ');

    @Component({
      template: `
        <my-cmp ${inputBindings}></my-cmp>
      `,
    })
    class ParentComponent {}

    const fixture = TestBed.configureTestingModule({
      declarations: [ParentComponent, clazz],
    }).createComponent(ParentComponent);
    fixture.detectChanges();
    fixture.destroy();
    return log;
  }

  function createLoggingSpiesFromProto(clazz: Type<any>, log: any[]) {
    const proto = clazz.prototype;
    // For ES2015+ classes, members are not enumerable in the prototype.
    Object.getOwnPropertyNames(proto).forEach((method) => {
      if (method === 'constructor') {
        return;
      }

      proto[method] = (...args: any[]) => {
        log.push([method, args]);
      };
    });
  }
})();

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component, ViewEncapsulation} from '@angular/core';

// #docregion longform
@Component({
  selector: 'app-root',
  template: `
    <h1>Hello World!</h1>
    <span class="red">Shadow DOM Rocks!</span>
  `,
  styles: [
    `
      :host {
        display: block;
        border: 1px solid black;
      }
      h1 {
        color: blue;
      }
      .red {
        background-color: red;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.ShadowDom,
})
class MyApp {}
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/* tslint:disable:no-console  */
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  NgModule,
} from '@angular/core';
import {FormsModule} from '@angular/forms';

// #docregion mark-for-check
@Component({
  selector: 'app-root',
  template: `
    Number of ticks: {{ numberOfTicks }}
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AppComponent {
  numberOfTicks = 0;

  constructor(private ref: ChangeDetectorRef) {
    setInterval(() => {
      this.numberOfTicks++;
      // require view to be updated
      this.ref.markForCheck();
    }, 1000);
  }
}
// #enddocregion mark-for-check

// #docregion detach
class DataListProvider {
  // in a real application the returned data will be different every time
  get data() {
    return [1, 2, 3, 4, 5];
  }
}

@Component({
  selector: 'giant-list',
  template: `
    <li *ngFor="let d of dataProvider.data">Data {{ d }}</li>
  `,
})
class GiantList {
  constructor(
    private ref: ChangeDetectorRef,
    public dataProvider: DataListProvider,
  ) {
    ref.detach();
    setInterval(() => {
      this.ref.detectChanges();
    }, 5000);
  }
}

@Component({
  selector: 'app',
  providers: [DataListProvider],
  template: `
    <giant-list></giant-list>
  `,
})
class App {}
// #enddocregion detach

// #docregion reattach
class DataProvider {
  data = 1;
  constructor() {
    setInterval(() => {
      this.data = 2;
    }, 500);
  }
}

@Component({selector: 'live-data', inputs: ['live'], template: 'Data: {{dataProvider.data}}'})
class LiveData {
  constructor(
    private ref: ChangeDetectorRef,
    public dataProvider: DataProvider,
  ) {}

  @Input()
  set live(value: boolean) {
    if (value) {
      this.ref.reattach();
    } else {
      this.ref.detach();
    }
  }
}

@Component({
  selector: 'app',
  providers: [DataProvider],
  template: `
    Live Update:
    <input type="checkbox" [(ngModel)]="live" />
    <live-data [live]="live"></live-data>
  `,
})
class App1 {
  live = true;
}
// #enddocregion reattach

@NgModule({declarations: [AppComponent, GiantList, App, LiveData, App1], imports: [FormsModule]})
class CoreExamplesModule {}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {DebugElement} from '@angular/core';

let debugElement: DebugElement = undefined!;
let predicate: any;

debugElement.query(predicate);

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

let db: any;
class MyService {}
class MyMockService implements MyService {}

describe('some component', () => {
  it('does something', () => {
    // This is a test.
  });
});

// tslint:disable-next-line:ban
fdescribe('some component', () => {
  it('has a test', () => {
    // This test will run.
  });
});
describe('another component', () => {
  it('also has a test', () => {
    throw 'This test will not run.';
  });
});

xdescribe('some component', () => {
  it('has a test', () => {
    throw 'This test will not run.';
  });
});
describe('another component', () => {
  it('also has a test', () => {
    // This test will run.
  });
});

describe('some component', () => {
  // tslint:disable-next-line:ban
  fit('has a test', () => {
    // This test will run.
  });
  it('has another test', () => {
    throw 'This test will not run.';
  });
});

describe('some component', () => {
  xit('has a test', () => {
    throw 'This test will not run.';
  });
  it('has another test', () => {
    // This test will run.
  });
});

describe('some component', () => {
  beforeEach(() => {
    db.connect();
  });
  it('uses the db', () => {
    // Database is connected.
  });
});

describe('some component', () => {
  afterEach((done: Function) => {
    db.reset().then((_: any) => done());
  });
  it('uses the db', () => {
    // This test can leave the database in a dirty state.
    // The afterEach will ensure it gets reset.
  });
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  Component,
  Injectable,
  Injector,
  Input,
  NgModule,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

// #docregion SimpleExample
@Component({selector: 'hello-world', template: 'Hello World!'})
export class HelloWorld {}

@Component({
  selector: 'ng-component-outlet-simple-example',
  template: `
    <ng-container *ngComponentOutlet="HelloWorld"></ng-container>
  `,
})
export class NgComponentOutletSimpleExample {
  // This field is necessary to expose HelloWorld to the template.
  HelloWorld = HelloWorld;
}
// #enddocregion

// #docregion CompleteExample
@Injectable()
export class Greeter {
  suffix = '!';
}

@Component({
  selector: 'complete-component',
  template: `
    {{ label }}:
    <ng-content></ng-content>
    <ng-content></ng-content>
    {{ greeter.suffix }}
  `,
})
export class CompleteComponent {
  @Input() label!: string;

  constructor(public greeter: Greeter) {}
}

@Component({
  selector: 'ng-component-outlet-complete-example',
  template: `
    <ng-template #ahoj>Ahoj</ng-template>
    <ng-template #svet>Svet</ng-template>
    <ng-container
      *ngComponentOutlet="
        CompleteComponent;
        inputs: myInputs;
        injector: myInjector;
        content: myContent
      "
    ></ng-container>
  `,
})
export class NgComponentOutletCompleteExample implements OnInit {
  // This field is necessary to expose CompleteComponent to the template.
  CompleteComponent = CompleteComponent;

  myInputs = {'label': 'Complete'};

  myInjector: Injector;
  @ViewChild('ahoj', {static: true}) ahojTemplateRef!: TemplateRef<any>;
  @ViewChild('svet', {static: true}) svetTemplateRef!: TemplateRef<any>;
  myContent?: any[][];

  constructor(
    injector: Injector,
    private vcr: ViewContainerRef,
  ) {
    this.myInjector = Injector.create({
      providers: [{provide: Greeter, deps: []}],
      parent: injector,
    });
  }

  ngOnInit() {
    // Create the projectable content from the templates
    this.myContent = [
      this.vcr.createEmbeddedView(this.ahojTemplateRef).rootNodes,
      this.vcr.createEmbeddedView(this.svetTemplateRef).rootNodes,
    ];
  }
}
// #enddocregion

@Component({
  selector: 'example-app',
  template: `
    <ng-component-outlet-simple-example></ng-component-outlet-simple-example>
    <hr />
    <ng-component-outlet-complete-example></ng-component-outlet-complete-example>
  `,
})
export class AppComponent {}

@NgModule({
  imports: [BrowserModule],
  declarations: [
    AppComponent,
    NgComponentOutletSimpleExample,
    NgComponentOutletCompleteExample,
    HelloWorld,
    CompleteComponent,
  ],
})
export class AppModule {}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {$, browser, by, element, ExpectedConditions} from 'protractor';

import {verifyNoBrowserErrors} from '../../../../test-utils';

function waitForElement(selector: string) {
  const EC = ExpectedConditions;
  // Waits for the element with id 'abc' to be present on the dom.
  browser.wait(EC.presenceOf($(selector)), 20000);
}

describe('ngComponentOutlet', () => {
  const URL = '/ngComponentOutlet';
  afterEach(verifyNoBrowserErrors);

  describe('ng-component-outlet-example', () => {
    it('should render simple', () => {
      browser.get(URL);
      waitForElement('ng-component-outlet-simple-example');
      expect(element.all(by.css('hello-world')).getText()).toEqual(['Hello World!']);
    });
  });
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import 'zone.js/lib/browser/rollup-main';

import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {TestsAppModule} from './test_module';

platformBrowserDynamic().bootstrapModule(TestsAppModule);

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {APP_BASE_HREF} from '@angular/common';
import {Component, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {HashLocationComponent} from './hash_location_component';
import {PathLocationComponent} from './path_location_component';

@Component({
  selector: 'example-app',
  template: `
    <hash-location></hash-location>
    <path-location></path-location>
  `,
})
export class AppComponent {}

@NgModule({
  declarations: [AppComponent, PathLocationComponent, HashLocationComponent],
  providers: [{provide: APP_BASE_HREF, useValue: '/'}],
  imports: [BrowserModule],
})
export class AppModule {}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// #docregion LocationComponent
import {Location, LocationStrategy, PathLocationStrategy} from '@angular/common';
import {Component} from '@angular/core';

@Component({
  selector: 'path-location',
  providers: [Location, {provide: LocationStrategy, useClass: PathLocationStrategy}],
  template: `
    <h1>PathLocationStrategy</h1>
    Current URL is:
    <code>{{ location.path() }}</code>
    <br />
    Normalize:
    <code>/foo/bar/</code>
    is:
    <code>{{ location.normalize('foo/bar') }}</code>
    <br />
  `,
})
export class PathLocationComponent {
  location: Location;
  constructor(location: Location) {
    this.location = location;
  }
}
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {$, browser, by, element, protractor} from 'protractor';

import {verifyNoBrowserErrors} from '../../../../test-utils';

function waitForElement(selector: string) {
  const EC = (<any>protractor).ExpectedConditions;
  // Waits for the element with id 'abc' to be present on the dom.
  browser.wait(EC.presenceOf($(selector)), 20000);
}

describe('Location', () => {
  afterEach(verifyNoBrowserErrors);

  it('should verify paths', () => {
    browser.get('/location/#/bar/baz');
    waitForElement('hash-location');
    expect(element.all(by.css('path-location code')).get(0).getText()).toEqual('/location');
    expect(element.all(by.css('hash-location code')).get(0).getText()).toEqual('/bar/baz');
  });
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// #docregion LocationComponent
import {HashLocationStrategy, Location, LocationStrategy} from '@angular/common';
import {Component} from '@angular/core';

@Component({
  selector: 'hash-location',
  providers: [Location, {provide: LocationStrategy, useClass: HashLocationStrategy}],
  template: `
    <h1>HashLocationStrategy</h1>
    Current URL is:
    <code>{{ location.path() }}</code>
    <br />
    Normalize:
    <code>/foo/bar/</code>
    is:
    <code>{{ location.normalize('foo/bar') }}</code>
    <br />
  `,
})
export class HashLocationComponent {
  location: Location;
  constructor(location: Location) {
    this.location = location;
  }
}
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

// #docregion NgTemplateOutlet
@Component({
  selector: 'ng-template-outlet-example',
  template: `
    <ng-container *ngTemplateOutlet="greet"></ng-container>
    <hr />
    <ng-container *ngTemplateOutlet="eng; context: myContext"></ng-container>
    <hr />
    <ng-container *ngTemplateOutlet="svk; context: myContext"></ng-container>
    <hr />

    <ng-template #greet><span>Hello</span></ng-template>
    <ng-template #eng let-name>
      <span>Hello {{ name }}!</span>
    </ng-template>
    <ng-template #svk let-person="localSk">
      <span>Ahoj {{ person }}!</span>
    </ng-template>
  `,
})
export class NgTemplateOutletExample {
  myContext = {$implicit: 'World', localSk: 'Svet'};
}
// #enddocregion

@Component({
  selector: 'example-app',
  template: `
    <ng-template-outlet-example></ng-template-outlet-example>
  `,
})
export class AppComponent {}

@NgModule({
  imports: [BrowserModule],
  declarations: [AppComponent, NgTemplateOutletExample],
})
export class AppModule {}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {$, browser, by, element, ExpectedConditions} from 'protractor';

import {verifyNoBrowserErrors} from '../../../../test-utils';

function waitForElement(selector: string) {
  const EC = ExpectedConditions;
  // Waits for the element with id 'abc' to be present on the dom.
  browser.wait(EC.presenceOf($(selector)), 20000);
}

describe('ngTemplateOutlet', () => {
  const URL = '/ngTemplateOutlet';
  afterEach(verifyNoBrowserErrors);

  describe('ng-template-outlet-example', () => {
    it('should render', () => {
      browser.get(URL);
      waitForElement('ng-template-outlet-example');
      expect(element.all(by.css('ng-template-outlet-example span')).getText()).toEqual([
        'Hello',
        'Hello World!',
        'Ahoj Svet!',
      ]);
    });
  });
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {registerLocaleData} from '@angular/common';
import {Component} from '@angular/core';
// we need to import data for the french locale
import localeFr from './locale-fr';

// registering french data
registerLocaleData(localeFr);

// #docregion PercentPipe
@Component({
  selector: 'percent-pipe',
  template: `
    <div>
      <!--output '26%'-->
      <p>A: {{ a | percent }}</p>

      <!--output '0,134.950%'-->
      <p>B: {{ b | percent : '4.3-5' }}</p>

      <!--output '0 134,950 %'-->
      <p>B: {{ b | percent : '4.3-5' : 'fr' }}</p>
    </div>
  `,
})
export class PercentPipeComponent {
  a: number = 0.259;
  b: number = 1.3495;
}
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// THIS CODE IS GENERATED - DO NOT MODIFY
// See angular/tools/gulp-tasks/cldr/extract.js

const u = undefined;

function plural(n: number): number {
  let i = Math.floor(Math.abs(n));
  if (i === 0 || i === 1) return 1;
  return 5;
}

export default [
  'fr',
  [['AM', 'PM'], u, u],
  u,
  [
    ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
    ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'],
    ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
    ['di', 'lu', 'ma', 'me', 'je', 've', 'sa'],
  ],
  u,
  [
    ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
    [
      'janv.',
      'févr.',
      'mars',
      'avr.',
      'mai',
      'juin',
      'juil.',
      'août',
      'sept.',
      'oct.',
      'nov.',
      'déc.',
    ],
    [
      'janvier',
      'février',
      'mars',
      'avril',
      'mai',
      'juin',
      'juillet',
      'août',
      'septembre',
      'octobre',
      'novembre',
      'décembre',
    ],
  ],
  u,
  [['av. J.-C.', 'ap. J.-C.'], u, ['avant Jésus-Christ', 'après Jésus-Christ']],
  1,
  [6, 0],
  ['dd/MM/y', 'd MMM y', 'd MMMM y', 'EEEE d MMMM y'],
  ['HH:mm', 'HH:mm:ss', 'HH:mm:ss z', 'HH:mm:ss zzzz'],
  ['{1} {0}', "{1} 'à' {0}", u, u],
  [',', '\u202f', ';', '%', '+', '-', 'E', '×', '‰', '∞', 'NaN', ':'],
  ['#,##0.###', '#,##0 %', '#,##0.00 ¤', '#E0'],
  'EUR',
  '€',
  'euro',
  {
    'ARS': ['$AR', '$'],
    'AUD': ['$AU', '$'],
    'BEF': ['FB'],
    'BMD': ['$BM', '$'],
    'BND': ['$BN', '$'],
    'BZD': ['$BZ', '$'],
    'CAD': ['$CA', '$'],
    'CLP': ['$CL', '$'],
    'CNY': [u, '¥'],
    'COP': ['$CO', '$'],
    'CYP': ['£CY'],
    'EGP': [u, '£E'],
    'FJD': ['$FJ', '$'],
    'FKP': ['£FK', '£'],
    'FRF': ['F'],
    'GBP': ['£GB', '£'],
    'GIP': ['£GI', '£'],
    'HKD': [u, '$'],
    'IEP': ['£IE'],
    'ILP': ['£IL'],
    'ITL': ['₤IT'],
    'JPY': [u, '¥'],
    'KMF': [u, 'FC'],
    'LBP': ['£LB', '£L'],
    'MTP': ['£MT'],
    'MXN': ['$MX', '$'],
    'NAD': ['$NA', '$'],
    'NIO': [u, '$C'],
    'NZD': ['$NZ', '$'],
    'RHD': ['$RH'],
    'RON': [u, 'L'],
    'RWF': [u, 'FR'],
    'SBD': ['$SB', '$'],
    'SGD': ['$SG', '$'],
    'SRD': ['$SR', '$'],
    'TOP': [u, '$T'],
    'TTD': ['$TT', '$'],
    'TWD': [u, 'NT$'],
    'USD': ['$US', '$'],
    'UYU': ['$UY', '$'],
    'WST': ['$WS'],
    'XCD': [u, '$'],
    'XPF': ['FCFP'],
    'ZMW': [u, 'Kw'],
  },
  'ltr',
  plural,
];

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {registerLocaleData} from '@angular/common';
import {Component} from '@angular/core';
// we need to import data for the french locale
import localeFr from './locale-fr';

// registering french data
registerLocaleData(localeFr);

// #docregion CurrencyPipe
@Component({
  selector: 'currency-pipe',
  template: `
    <div>
      <!--output '$0.26'-->
      <p>A: {{ a | currency }}</p>

      <!--output 'CA$0.26'-->
      <p>A: {{ a | currency : 'CAD' }}</p>

      <!--output 'CAD0.26'-->
      <p>A: {{ a | currency : 'CAD' : 'code' }}</p>

      <!--output 'CA$0,001.35'-->
      <p>B: {{ b | currency : 'CAD' : 'symbol' : '4.2-2' }}</p>

      <!--output '$0,001.35'-->
      <p>B: {{ b | currency : 'CAD' : 'symbol-narrow' : '4.2-2' }}</p>

      <!--output '0 001,35 CA$'-->
      <p>B: {{ b | currency : 'CAD' : 'symbol' : '4.2-2' : 'fr' }}</p>

      <!--output 'CLP1' because CLP has no cents-->
      <p>B: {{ b | currency : 'CLP' }}</p>
    </div>
  `,
})
export class CurrencyPipeComponent {
  a: number = 0.259;
  b: number = 1.3495;
}
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AsyncObservablePipeComponent, AsyncPromisePipeComponent} from './async_pipe';
import {CurrencyPipeComponent} from './currency_pipe';
import {DatePipeComponent, DeprecatedDatePipeComponent} from './date_pipe';
import {I18nPluralPipeComponent, I18nSelectPipeComponent} from './i18n_pipe';
import {JsonPipeComponent} from './json_pipe';
import {KeyValuePipeComponent} from './keyvalue_pipe';
import {LowerUpperPipeComponent} from './lowerupper_pipe';
import {NumberPipeComponent} from './number_pipe';
import {PercentPipeComponent} from './percent_pipe';
import {SlicePipeListComponent, SlicePipeStringComponent} from './slice_pipe';
import {TitleCasePipeComponent} from './titlecase_pipe';

@Component({
  selector: 'example-app',
  template: `
    <h1>Pipe Example</h1>

    <h2><code>async</code></h2>
    <async-promise-pipe></async-promise-pipe>
    <async-observable-pipe></async-observable-pipe>

    <h2><code>date</code></h2>
    <date-pipe></date-pipe>

    <h2><code>json</code></h2>
    <json-pipe></json-pipe>

    <h2>
      <code>lower</code>
      ,
      <code>upper</code>
    </h2>
    <lowerupper-pipe></lowerupper-pipe>

    <h2><code>titlecase</code></h2>
    <titlecase-pipe></titlecase-pipe>

    <h2><code>number</code></h2>
    <number-pipe></number-pipe>
    <percent-pipe></percent-pipe>
    <currency-pipe></currency-pipe>

    <h2><code>slice</code></h2>
    <slice-string-pipe></slice-string-pipe>
    <slice-list-pipe></slice-list-pipe>

    <h2><code>i18n</code></h2>
    <i18n-plural-pipe></i18n-plural-pipe>
    <i18n-select-pipe></i18n-select-pipe>

    <h2><code>keyvalue</code></h2>
    <keyvalue-pipe></keyvalue-pipe>
  `,
})
export class AppComponent {}

@NgModule({
  declarations: [
    AsyncPromisePipeComponent,
    AsyncObservablePipeComponent,
    AppComponent,
    JsonPipeComponent,
    DatePipeComponent,
    DeprecatedDatePipeComponent,
    LowerUpperPipeComponent,
    TitleCasePipeComponent,
    NumberPipeComponent,
    PercentPipeComponent,
    CurrencyPipeComponent,
    SlicePipeStringComponent,
    SlicePipeListComponent,
    I18nPluralPipeComponent,
    I18nSelectPipeComponent,
    KeyValuePipeComponent,
  ],
  imports: [BrowserModule],
})
export class AppModule {}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component} from '@angular/core';
import {Observable, Observer} from 'rxjs';

// #docregion AsyncPipePromise
@Component({
  selector: 'async-promise-pipe',
  template: `
    <div>
      <code>promise|async</code>
      :
      <button (click)="clicked()">{{ arrived ? 'Reset' : 'Resolve' }}</button>
      <span>Wait for it... {{ greeting | async }}</span>
    </div>
  `,
})
export class AsyncPromisePipeComponent {
  greeting: Promise<string> | null = null;
  arrived: boolean = false;

  private resolve: Function | null = null;

  constructor() {
    this.reset();
  }

  reset() {
    this.arrived = false;
    this.greeting = new Promise<string>((resolve, reject) => {
      this.resolve = resolve;
    });
  }

  clicked() {
    if (this.arrived) {
      this.reset();
    } else {
      this.resolve!('hi there!');
      this.arrived = true;
    }
  }
}
// #enddocregion

// #docregion AsyncPipeObservable
@Component({
  selector: 'async-observable-pipe',
  template: '<div><code>observable|async</code>: Time: {{ time | async }}</div>',
})
export class AsyncObservablePipeComponent {
  time = new Observable<string>((observer: Observer<string>) => {
    setInterval(() => observer.next(new Date().toString()), 1000);
  });
}
// #enddocregion

// For some reason protractor hangs on setInterval. So we will run outside of angular zone so that
// protractor will not see us. Also we want to have this outside the docregion so as not to confuse
// the reader.
function setInterval(fn: Function, delay: number) {
  const zone = (window as any)['Zone'].current;
  let rootZone = zone;
  while (rootZone.parent) {
    rootZone = rootZone.parent;
  }
  rootZone.run(() => {
    window.setInterval(function (this: unknown) {
      zone.run(fn, this, arguments as any);
    }, delay);
  });
}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component} from '@angular/core';

// #docregion LowerUpperPipe
@Component({
  selector: 'lowerupper-pipe',
  template: `
    <div>
      <label>Name:</label>
      <input #name (keyup)="change(name.value)" type="text" />
      <p>In lowercase:</p>
      <pre>'{{ value | lowercase }}'</pre>
      <p>In uppercase:</p>
      <pre>'{{ value | uppercase }}'</pre>
    </div>
  `,
})
export class LowerUpperPipeComponent {
  value: string = '';
  change(value: string) {
    this.value = value;
  }
}
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component} from '@angular/core';

// #docregion SlicePipe_string
@Component({
  selector: 'slice-string-pipe',
  template: `
    <div>
      <p>{{ str }}[0:4]: '{{ str | slice : 0 : 4 }}' - output is expected to be 'abcd'</p>
      <p>{{ str }}[4:0]: '{{ str | slice : 4 : 0 }}' - output is expected to be ''</p>
      <p>{{ str }}[-4]: '{{ str | slice : -4 }}' - output is expected to be 'ghij'</p>
      <p>{{ str }}[-4:-2]: '{{ str | slice : -4 : -2 }}' - output is expected to be 'gh'</p>
      <p>{{ str }}[-100]: '{{ str | slice : -100 }}' - output is expected to be 'abcdefghij'</p>
      <p>{{ str }}[100]: '{{ str | slice : 100 }}' - output is expected to be ''</p>
    </div>
  `,
})
export class SlicePipeStringComponent {
  str: string = 'abcdefghij';
}
// #enddocregion

// #docregion SlicePipe_list
@Component({
  selector: 'slice-list-pipe',
  template: `
    <ul>
      <li *ngFor="let i of collection | slice : 1 : 3">{{ i }}</li>
    </ul>
  `,
})
export class SlicePipeListComponent {
  collection: string[] = ['a', 'b', 'c', 'd'];
}
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component} from '@angular/core';

// #docregion KeyValuePipe
@Component({
  selector: 'keyvalue-pipe',
  template: `
    <span>
      <p>Object</p>
      <div *ngFor="let item of object | keyvalue">{{ item.key }}:{{ item.value }}</div>
      <p>Map</p>
      <div *ngFor="let item of map | keyvalue">{{ item.key }}:{{ item.value }}</div>
    </span>
  `,
})
export class KeyValuePipeComponent {
  object: {[key: number]: string} = {2: 'foo', 1: 'bar'};
  map = new Map([
    [2, 'foo'],
    [1, 'bar'],
  ]);
}
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component} from '@angular/core';

// #docregion TitleCasePipe
@Component({
  selector: 'titlecase-pipe',
  template: `
    <div>
      <p>{{ 'some string' | titlecase }}</p>
      <!-- output is expected to be "Some String" -->
      <p>{{ 'tHIs is mIXeD CaSe' | titlecase }}</p>
      <!-- output is expected to be "This Is Mixed Case" -->
      <p>{{ "it's non-trivial question" | titlecase }}</p>
      <!-- output is expected to be "It's Non-trivial Question" -->
      <p>{{ 'one,two,three' | titlecase }}</p>
      <!-- output is expected to be "One,two,three" -->
      <p>{{ 'true|false' | titlecase }}</p>
      <!-- output is expected to be "True|false" -->
      <p>{{ 'foo-vs-bar' | titlecase }}</p>
      <!-- output is expected to be "Foo-vs-bar" -->
    </div>
  `,
})
export class TitleCasePipeComponent {}
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {$, browser, by, element, ExpectedConditions} from 'protractor';

import {verifyNoBrowserErrors} from '../../../../test-utils';

function waitForElement(selector: string) {
  const EC = ExpectedConditions;
  // Waits for the element with id 'abc' to be present on the dom.
  browser.wait(EC.presenceOf($(selector)), 20000);
}

describe('pipe', () => {
  afterEach(verifyNoBrowserErrors);
  const URL = '/pipes';

  describe('async', () => {
    it('should resolve and display promise', () => {
      browser.get(URL);
      waitForElement('async-promise-pipe');
      expect(element.all(by.css('async-promise-pipe span')).get(0).getText()).toEqual(
        'Wait for it...',
      );
      element(by.css('async-promise-pipe button')).click();
      expect(element.all(by.css('async-promise-pipe span')).get(0).getText()).toEqual(
        'Wait for it... hi there!',
      );
    });
  });

  describe('lowercase/uppercase', () => {
    it('should work properly', () => {
      browser.get(URL);
      waitForElement('lowerupper-pipe');
      element(by.css('lowerupper-pipe input')).sendKeys('Hello World!');
      expect(element.all(by.css('lowerupper-pipe pre')).get(0).getText()).toEqual("'hello world!'");
      expect(element.all(by.css('lowerupper-pipe pre')).get(1).getText()).toEqual("'HELLO WORLD!'");
    });
  });

  describe('titlecase', () => {
    it('should work properly', () => {
      browser.get(URL);
      waitForElement('titlecase-pipe');
      expect(element.all(by.css('titlecase-pipe p')).get(0).getText()).toEqual('Some String');
      expect(element.all(by.css('titlecase-pipe p')).get(1).getText()).toEqual(
        'This Is Mixed Case',
      );
      expect(element.all(by.css('titlecase-pipe p')).get(2).getText()).toEqual(
        "It's Non-trivial Question",
      );
      expect(element.all(by.css('titlecase-pipe p')).get(3).getText()).toEqual('One,two,three');
      expect(element.all(by.css('titlecase-pipe p')).get(4).getText()).toEqual('True|false');
      expect(element.all(by.css('titlecase-pipe p')).get(5).getText()).toEqual('Foo-vs-bar');
    });
  });

  describe('keyvalue', () => {
    it('should work properly', () => {
      browser.get(URL);
      waitForElement('keyvalue-pipe');
      expect(element.all(by.css('keyvalue-pipe div')).get(0).getText()).toEqual('1:bar');
      expect(element.all(by.css('keyvalue-pipe div')).get(1).getText()).toEqual('2:foo');
      expect(element.all(by.css('keyvalue-pipe div')).get(2).getText()).toEqual('1:bar');
      expect(element.all(by.css('keyvalue-pipe div')).get(3).getText()).toEqual('2:foo');
    });
  });

  describe('number', () => {
    it('should work properly', () => {
      browser.get(URL);
      waitForElement('number-pipe');
      const examples = element.all(by.css('number-pipe p'));
      expect(examples.get(0).getText()).toEqual('No specified formatting: 3.142');
      expect(examples.get(1).getText()).toEqual('With digitsInfo parameter specified: 0,003.14159');
      expect(examples.get(2).getText()).toEqual(
        'With digitsInfo and locale parameters specified: 0\u202f003,14159',
      );
    });
  });

  describe('percent', () => {
    it('should work properly', () => {
      browser.get(URL);
      waitForElement('percent-pipe');
      const examples = element.all(by.css('percent-pipe p'));
      expect(examples.get(0).getText()).toEqual('A: 26%');
      expect(examples.get(1).getText()).toEqual('B: 0,134.950%');
      expect(examples.get(2).getText()).toEqual('B: 0\u202f134,950 %');
    });
  });

  describe('currency', () => {
    it('should work properly', () => {
      browser.get(URL);
      waitForElement('currency-pipe');
      const examples = element.all(by.css('currency-pipe p'));
      expect(examples.get(0).getText()).toEqual('A: $0.26');
      expect(examples.get(1).getText()).toEqual('A: CA$0.26');
      expect(examples.get(2).getText()).toEqual('A: CAD0.26');
      expect(examples.get(3).getText()).toEqual('B: CA$0,001.35');
      expect(examples.get(4).getText()).toEqual('B: $0,001.35');
      expect(examples.get(5).getText()).toEqual('B: 0\u202f001,35 $CA');
      expect(examples.get(6).getText()).toEqual('B: CLP1');
    });
  });
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component} from '@angular/core';

// #docregion I18nPluralPipeComponent
@Component({
  selector: 'i18n-plural-pipe',
  template: `
    <div>{{ messages.length | i18nPlural : messageMapping }}</div>
  `,
})
export class I18nPluralPipeComponent {
  messages: any[] = ['Message 1'];
  messageMapping: {[k: string]: string} = {
    '=0': 'No messages.',
    '=1': 'One message.',
    'other': '# messages.',
  };
}
// #enddocregion

// #docregion I18nSelectPipeComponent
@Component({
  selector: 'i18n-select-pipe',
  template: `
    <div>{{ gender | i18nSelect : inviteMap }}</div>
  `,
})
export class I18nSelectPipeComponent {
  gender: string = 'male';
  inviteMap: any = {'male': 'Invite him.', 'female': 'Invite her.', 'other': 'Invite them.'};
}
//#enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {registerLocaleData} from '@angular/common';
import {Component} from '@angular/core';
// we need to import data for the french locale
import localeFr from './locale-fr';

// registering french data
registerLocaleData(localeFr);

@Component({
  selector: 'date-pipe',
  template: `
    <div>
      <!--output 'Jun 15, 2015'-->
      <p>Today is {{ today | date }}</p>

      <!--output 'Monday, June 15, 2015'-->
      <p>Or if you prefer, {{ today | date : 'fullDate' }}</p>

      <!--output '9:43 AM'-->
      <p>The time is {{ today | date : 'shortTime' }}</p>

      <!--output 'Monday, June 15, 2015 at 9:03:01 AM GMT+01:00' -->
      <p>The full date/time is {{ today | date : 'full' }}</p>

      <!--output 'Lundi 15 Juin 2015 à 09:03:01 GMT+01:00'-->
      <p>The full date/time in french is: {{ today | date : 'full' : '' : 'fr' }}</p>

      <!--output '2015-06-15 05:03 PM GMT+9'-->
      <p>The custom date is {{ today | date : 'yyyy-MM-dd HH:mm a z' : '+0900' }}</p>

      <!--output '2015-06-15 09:03 AM GMT+9'-->
      <p>
        The custom date with fixed timezone is
        {{ fixedTimezone | date : 'yyyy-MM-dd HH:mm a z' : '+0900' }}
      </p>
    </div>
  `,
})
export class DatePipeComponent {
  today = Date.now();
  fixedTimezone = '2015-06-15T09:03:01+0900';
}
@Component({
  selector: 'deprecated-date-pipe',
  template: `
    <div>
      <!--output 'Sep 3, 2010'-->
      <p>Today is {{ today | date }}</p>

      <!--output 'Friday, September 3, 2010'-->
      <p>Or if you prefer, {{ today | date : 'fullDate' }}</p>

      <!--output '12:05 PM'-->
      <p>The time is {{ today | date : 'shortTime' }}</p>

      <!--output '2010-09-03 12:05 PM'-->
      <p>The custom date is {{ today | date : 'yyyy-MM-dd HH:mm a' }}</p>
    </div>
  `,
})
export class DeprecatedDatePipeComponent {
  today = Date.now();
}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component} from '@angular/core';

// #docregion JsonPipe
@Component({
  selector: 'json-pipe',
  template: `
    <div>
      <p>Without JSON pipe:</p>
      <pre>{{ object }}</pre>
      <p>With JSON pipe:</p>
      <pre>{{ object | json }}</pre>
    </div>
  `,
})
export class JsonPipeComponent {
  object: Object = {foo: 'bar', baz: 'qux', nested: {xyz: 3, numbers: [1, 2, 3, 4, 5]}};
}
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {registerLocaleData} from '@angular/common';
import {Component} from '@angular/core';
// we need to import data for the french locale
import localeFr from './locale-fr';

registerLocaleData(localeFr, 'fr');

// #docregion NumberPipe
@Component({
  selector: 'number-pipe',
  template: `
    <div>
      <p>
        No specified formatting:
        {{ pi | number }}
        <!--output: '3.142'-->
      </p>

      <p>
        With digitsInfo parameter specified:
        {{ pi | number : '4.1-5' }}
        <!--output: '0,003.14159'-->
      </p>

      <p>
        With digitsInfo and locale parameters specified:
        {{ pi | number : '4.1-5' : 'fr' }}
        <!--output: '0 003,14159'-->
      </p>
    </div>
  `,
})
export class NumberPipeComponent {
  pi: number = 3.14159265359;
}
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component, NgModule, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {Subject} from 'rxjs';

// #docregion NgIfSimple
@Component({
  selector: 'ng-if-simple',
  template: `
    <button (click)="show = !show">{{ show ? 'hide' : 'show' }}</button>
    show = {{ show }}
    <br />
    <div *ngIf="show">Text to show</div>
  `,
})
export class NgIfSimple {
  show = true;
}
// #enddocregion

// #docregion NgIfElse
@Component({
  selector: 'ng-if-else',
  template: `
    <button (click)="show = !show">{{ show ? 'hide' : 'show' }}</button>
    show = {{ show }}
    <br />
    <div *ngIf="show; else elseBlock">Text to show</div>
    <ng-template #elseBlock>Alternate text while primary text is hidden</ng-template>
  `,
})
export class NgIfElse {
  show = true;
}
// #enddocregion

// #docregion NgIfThenElse
@Component({
  selector: 'ng-if-then-else',
  template: `
    <button (click)="show = !show">{{ show ? 'hide' : 'show' }}</button>
    <button (click)="switchPrimary()">Switch Primary</button>
    show = {{ show }}
    <br />
    <div *ngIf="show; then thenBlock; else elseBlock">this is ignored</div>
    <ng-template #primaryBlock>Primary text to show</ng-template>
    <ng-template #secondaryBlock>Secondary text to show</ng-template>
    <ng-template #elseBlock>Alternate text while primary text is hidden</ng-template>
  `,
})
export class NgIfThenElse implements OnInit {
  thenBlock: TemplateRef<any> | null = null;
  show = true;

  @ViewChild('primaryBlock', {static: true}) primaryBlock: TemplateRef<any> | null = null;
  @ViewChild('secondaryBlock', {static: true}) secondaryBlock: TemplateRef<any> | null = null;

  switchPrimary() {
    this.thenBlock = this.thenBlock === this.primaryBlock ? this.secondaryBlock : this.primaryBlock;
  }

  ngOnInit() {
    this.thenBlock = this.primaryBlock;
  }
}
// #enddocregion

// #docregion NgIfAs
@Component({
  selector: 'ng-if-as',
  template: `
    <button (click)="nextUser()">Next User</button>
    <br />
    <div *ngIf="userObservable | async as user; else loading">
      Hello {{ user.last }}, {{ user.first }}!
    </div>
    <ng-template #loading let-user>Waiting... (user is {{ user | json }})</ng-template>
  `,
})
export class NgIfAs {
  userObservable = new Subject<{first: string; last: string}>();
  first = ['John', 'Mike', 'Mary', 'Bob'];
  firstIndex = 0;
  last = ['Smith', 'Novotny', 'Angular'];
  lastIndex = 0;

  nextUser() {
    let first = this.first[this.firstIndex++];
    if (this.firstIndex >= this.first.length) this.firstIndex = 0;
    let last = this.last[this.lastIndex++];
    if (this.lastIndex >= this.last.length) this.lastIndex = 0;
    this.userObservable.next({first, last});
  }
}
// #enddocregion

@Component({
  selector: 'example-app',
  template: `
    <ng-if-simple></ng-if-simple>
    <hr />
    <ng-if-else></ng-if-else>
    <hr />
    <ng-if-then-else></ng-if-then-else>
    <hr />
    <ng-if-as></ng-if-as>
    <hr />
  `,
})
export class AppComponent {}

@NgModule({
  imports: [BrowserModule],
  declarations: [AppComponent, NgIfSimple, NgIfElse, NgIfThenElse, NgIfAs],
})
export class AppModule {}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {$, browser, by, element, ExpectedConditions} from 'protractor';

import {verifyNoBrowserErrors} from '../../../../test-utils';

function waitForElement(selector: string) {
  const EC = ExpectedConditions;
  // Waits for the element with id 'abc' to be present on the dom.
  browser.wait(EC.presenceOf($(selector)), 20000);
}

describe('ngIf', () => {
  const URL = '/ngIf';
  afterEach(verifyNoBrowserErrors);

  describe('ng-if-simple', () => {
    let comp = 'ng-if-simple';
    it('should hide/show content', () => {
      browser.get(URL);
      waitForElement(comp);
      expect(element.all(by.css(comp)).get(0).getText()).toEqual('hide show = true\nText to show');
      element(by.css(comp + ' button')).click();
      expect(element.all(by.css(comp)).get(0).getText()).toEqual('show show = false');
    });
  });

  describe('ng-if-else', () => {
    let comp = 'ng-if-else';
    it('should hide/show content', () => {
      browser.get(URL);
      waitForElement(comp);
      expect(element.all(by.css(comp)).get(0).getText()).toEqual('hide show = true\nText to show');
      element(by.css(comp + ' button')).click();
      expect(element.all(by.css(comp)).get(0).getText()).toEqual(
        'show show = false\nAlternate text while primary text is hidden',
      );
    });
  });

  describe('ng-if-then-else', () => {
    let comp = 'ng-if-then-else';

    it('should hide/show content', () => {
      browser.get(URL);
      waitForElement(comp);
      expect(element.all(by.css(comp)).get(0).getText()).toEqual(
        'hideSwitch Primary show = true\nPrimary text to show',
      );
      element
        .all(by.css(comp + ' button'))
        .get(1)
        .click();
      expect(element.all(by.css(comp)).get(0).getText()).toEqual(
        'hideSwitch Primary show = true\nSecondary text to show',
      );
      element
        .all(by.css(comp + ' button'))
        .get(0)
        .click();
      expect(element.all(by.css(comp)).get(0).getText()).toEqual(
        'showSwitch Primary show = false\nAlternate text while primary text is hidden',
      );
    });
  });

  describe('ng-if-as', () => {
    let comp = 'ng-if-as';
    it('should hide/show content', () => {
      browser.get(URL);
      waitForElement(comp);
      expect(element.all(by.css(comp)).get(0).getText()).toEqual(
        'Next User\nWaiting... (user is null)',
      );
      element(by.css(comp + ' button')).click();
      expect(element.all(by.css(comp)).get(0).getText()).toEqual('Next User\nHello Smith, John!');
    });
  });
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component, NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';

import * as locationExample from './location/ts/module';
import * as ngComponentOutletExample from './ngComponentOutlet/ts/module';
import * as ngIfExample from './ngIf/ts/module';
import * as ngTemplateOutletExample from './ngTemplateOutlet/ts/module';
import * as pipesExample from './pipes/ts/module';

@Component({selector: 'example-app:not(y)', template: '<router-outlet></router-outlet>'})
export class TestsAppComponent {}

@NgModule({
  imports: [
    locationExample.AppModule,
    ngComponentOutletExample.AppModule,
    ngIfExample.AppModule,
    ngTemplateOutletExample.AppModule,
    pipesExample.AppModule,

    // Router configuration so that the individual e2e tests can load their
    // app components.
    RouterModule.forRoot([
      {path: 'location', component: locationExample.AppComponent},
      {path: 'ngComponentOutlet', component: ngComponentOutletExample.AppComponent},
      {path: 'ngIf', component: ngIfExample.AppComponent},
      {path: 'ngTemplateOutlet', component: ngTemplateOutletExample.AppComponent},
      {path: 'pipes', component: pipesExample.AppComponent},
    ]),
  ],
  declarations: [TestsAppComponent],
  bootstrap: [TestsAppComponent],
})
export class TestsAppModule {}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import 'zone.js/lib/browser/rollup-main';

import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './module';

platformBrowserDynamic().bootstrapModule(AppModule);

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// tslint:disable: no-duplicate-imports
import {Component} from '@angular/core';
// #docregion registration-options
import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {ServiceWorkerModule, SwRegistrationOptions} from '@angular/service-worker';
// #enddocregion registration-options
import {SwUpdate} from '@angular/service-worker';
// tslint:enable: no-duplicate-imports

@Component({
  selector: 'example-app',
  template: 'SW enabled: {{ swu.isEnabled }}',
})
export class AppComponent {
  constructor(readonly swu: SwUpdate) {}
}
// #docregion registration-options

@NgModule({
  // #enddocregion registration-options
  bootstrap: [AppComponent],
  declarations: [AppComponent],
  // #docregion registration-options
  imports: [BrowserModule, ServiceWorkerModule.register('ngsw-worker.js')],
  providers: [
    {
      provide: SwRegistrationOptions,
      useFactory: () => ({enabled: location.search.includes('sw=true')}),
    },
  ],
})
export class AppModule {}
// #enddocregion registration-options

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {browser, by, element} from 'protractor';
import {verifyNoBrowserErrors} from '../../../test-utils';

describe('SW `SwRegistrationOptions` example', () => {
  const pageUrl = '/registration-options';
  const appElem = element(by.css('example-app'));

  afterEach(verifyNoBrowserErrors);

  it('not register the SW by default', () => {
    browser.get(pageUrl);
    expect(appElem.getText()).toBe('SW enabled: false');
  });

  it('register the SW when navigating to `?sw=true`', () => {
    browser.get(`${pageUrl}?sw=true`);
    expect(appElem.getText()).toBe('SW enabled: true');
  });
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import 'zone.js/lib/browser/rollup-main';

import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './module';

platformBrowserDynamic().bootstrapModule(AppModule);

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// tslint:disable: no-duplicate-imports
import {Component, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {ServiceWorkerModule} from '@angular/service-worker';
// #docregion inject-sw-push
import {SwPush} from '@angular/service-worker';
// #enddocregion inject-sw-push
// tslint:enable: no-duplicate-imports

const PUBLIC_VAPID_KEY_OF_SERVER = '...';

@Component({
  selector: 'example-app',
  template: 'SW enabled: {{ swPush.isEnabled }}',
})
// #docregion inject-sw-push
export class AppComponent {
  constructor(readonly swPush: SwPush) {}
  // #enddocregion inject-sw-push

  // #docregion subscribe-to-push
  private async subscribeToPush() {
    try {
      const sub = await this.swPush.requestSubscription({
        serverPublicKey: PUBLIC_VAPID_KEY_OF_SERVER,
      });
      // TODO: Send to server.
    } catch (err) {
      console.error('Could not subscribe due to:', err);
    }
  }
  // #enddocregion subscribe-to-push

  private subscribeToNotificationClicks() {
    // #docregion subscribe-to-notification-clicks
    this.swPush.notificationClicks.subscribe(({action, notification}) => {
      // TODO: Do something in response to notification click.
    });
    // #enddocregion subscribe-to-notification-clicks
  }
  // #docregion inject-sw-push
}
// #enddocregion inject-sw-push

@NgModule({
  bootstrap: [AppComponent],
  declarations: [AppComponent],
  imports: [BrowserModule, ServiceWorkerModule.register('ngsw-worker.js')],
})
export class AppModule {}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {browser, by, element} from 'protractor';
import {verifyNoBrowserErrors} from '../../../test-utils';

describe('SW `SwPush` example', () => {
  const pageUrl = '/push';
  const appElem = element(by.css('example-app'));

  afterEach(verifyNoBrowserErrors);

  it('should be enabled', () => {
    browser.get(pageUrl);
    expect(appElem.getText()).toBe('SW enabled: true');
  });
});

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {DebugElement} from '@angular/core';
import {By} from '@angular/platform-browser';

let debugElement: DebugElement = undefined!;
class MyDirective {}

// #docregion by_all
debugElement.query(By.all());
// #enddocregion

// #docregion by_css
debugElement.query(By.css('[attribute]'));
// #enddocregion

// #docregion by_directive
debugElement.query(By.directive(MyDirective));
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

@Component({selector: 'my-component', template: 'text'})
class MyAppComponent {}
@NgModule({imports: [BrowserModule], bootstrap: [MyAppComponent]})
class AppModule {}
platformBrowserDynamic().bootstrapModule(AppModule);

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component, inject, Injectable} from '@angular/core';
import {bootstrapApplication} from '@angular/platform-browser';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  CanActivateChildFn,
  CanActivateFn,
  CanMatchFn,
  provideRouter,
  ResolveFn,
  Route,
  RouterStateSnapshot,
  UrlSegment,
} from '@angular/router';

@Component({template: ''})
export class App {}

@Component({template: ''})
export class TeamComponent {}

// #docregion CanActivateFn
@Injectable()
class UserToken {}

@Injectable()
class PermissionsService {
  canActivate(currentUser: UserToken, userId: string): boolean {
    return true;
  }
  canMatch(currentUser: UserToken): boolean {
    return true;
  }
}

const canActivateTeam: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  return inject(PermissionsService).canActivate(inject(UserToken), route.params['id']);
};
// #enddocregion

// #docregion CanActivateFnInRoute
bootstrapApplication(App, {
  providers: [
    provideRouter([
      {
        path: 'team/:id',
        component: TeamComponent,
        canActivate: [canActivateTeam],
      },
    ]),
  ],
});
// #enddocregion

// #docregion CanActivateChildFn
const canActivateChildExample: CanActivateChildFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  return inject(PermissionsService).canActivate(inject(UserToken), route.params['id']);
};

bootstrapApplication(App, {
  providers: [
    provideRouter([
      {
        path: 'team/:id',
        component: TeamComponent,
        canActivateChild: [canActivateChildExample],
        children: [],
      },
    ]),
  ],
});
// #enddocregion

// #docregion CanDeactivateFn
@Component({template: ''})
export class UserComponent {
  hasUnsavedChanges = true;
}

bootstrapApplication(App, {
  providers: [
    provideRouter([
      {
        path: 'user/:id',
        component: UserComponent,
        canDeactivate: [(component: UserComponent) => !component.hasUnsavedChanges],
      },
    ]),
  ],
});
// #enddocregion

// #docregion CanMatchFn
const canMatchTeam: CanMatchFn = (route: Route, segments: UrlSegment[]) => {
  return inject(PermissionsService).canMatch(inject(UserToken));
};

bootstrapApplication(App, {
  providers: [
    provideRouter([
      {
        path: 'team/:id',
        component: TeamComponent,
        canMatch: [canMatchTeam],
      },
    ]),
  ],
});
// #enddocregion

// #docregion ResolveDataUse
@Component({template: ''})
export class HeroDetailComponent {
  constructor(private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    this.activatedRoute.data.subscribe(({hero}) => {
      // do something with your resolved data ...
    });
  }
}
// #enddocregion

// #docregion ResolveFn
interface Hero {
  name: string;
}
@Injectable()
export class HeroService {
  getHero(id: string) {
    return {name: `Superman-${id}`};
  }
}

export const heroResolver: ResolveFn<Hero> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  return inject(HeroService).getHero(route.paramMap.get('id')!);
};

bootstrapApplication(App, {
  providers: [
    provideRouter([
      {
        path: 'detail/:id',
        component: HeroDetailComponent,
        resolve: {hero: heroResolver},
      },
    ]),
  ],
});
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import 'zone.js/lib/browser/rollup-main';

import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './module';

platformBrowserDynamic().bootstrapModule(AppModule);

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// #docregion activated-route
import {Component, NgModule} from '@angular/core';
// #enddocregion activated-route
import {BrowserModule} from '@angular/platform-browser';
// #docregion activated-route
import {ActivatedRoute, RouterModule} from '@angular/router';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
// #enddocregion activated-route

// #docregion activated-route

@Component({
  // #enddocregion activated-route
  selector: 'example-app',
  template: '...',
  // #docregion activated-route
})
export class ActivatedRouteComponent {
  constructor(route: ActivatedRoute) {
    const id: Observable<string> = route.params.pipe(map((p) => p['id']));
    const url: Observable<string> = route.url.pipe(map((segments) => segments.join('')));
    // route.data includes both `data` and `resolve`
    const user = route.data.pipe(map((d) => d['user']));
  }
}
// #enddocregion activated-route

@NgModule({
  imports: [BrowserModule, RouterModule.forRoot([])],
  declarations: [ActivatedRouteComponent],
  bootstrap: [ActivatedRouteComponent],
})
export class AppModule {}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Injectable} from '@angular/core';
import {mapToCanActivate, mapToResolve, Route} from '@angular/router';

// #docregion CanActivate
@Injectable({providedIn: 'root'})
export class AdminGuard {
  canActivate() {
    return true;
  }
}

const route: Route = {
  path: 'admin',
  canActivate: mapToCanActivate([AdminGuard]),
};
// #enddocregion

// #docregion Resolve
@Injectable({providedIn: 'root'})
export class ResolveUser {
  resolve() {
    return {name: 'Bob'};
  }
}

const userRoute: Route = {
  path: 'user',
  resolve: {
    user: mapToResolve(ResolveUser),
  },
};
// #enddocregion

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {AsyncPipe} from '@angular/common';
import {Component, inject} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {ActivatedRoute, CanActivateFn, provideRouter, Router} from '@angular/router';
import {RouterTestingHarness} from '@angular/router/testing';

describe('navigate for test examples', () => {
  // #docregion RoutedComponent
  it('navigates to routed component', async () => {
    @Component({standalone: true, template: 'hello {{name}}'})
    class TestCmp {
      name = 'world';
    }

    TestBed.configureTestingModule({
      providers: [provideRouter([{path: '', component: TestCmp}])],
    });

    const harness = await RouterTestingHarness.create();
    const activatedComponent = await harness.navigateByUrl('/', TestCmp);
    expect(activatedComponent).toBeInstanceOf(TestCmp);
    expect(harness.routeNativeElement?.innerHTML).toContain('hello world');
  });
  // #enddocregion

  it('testing a guard', async () => {
    @Component({standalone: true, template: ''})
    class AdminComponent {}
    @Component({standalone: true, template: ''})
    class LoginComponent {}

    // #docregion Guard
    let isLoggedIn = false;
    const isLoggedInGuard: CanActivateFn = () => {
      return isLoggedIn ? true : inject(Router).parseUrl('/login');
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {path: 'admin', canActivate: [isLoggedInGuard], component: AdminComponent},
          {path: 'login', component: LoginComponent},
        ]),
      ],
    });

    const harness = await RouterTestingHarness.create('/admin');
    expect(TestBed.inject(Router).url).toEqual('/login');
    isLoggedIn = true;
    await harness.navigateByUrl('/admin');
    expect(TestBed.inject(Router).url).toEqual('/admin');
    // #enddocregion
  });

  it('test a ActivatedRoute', async () => {
    // #docregion ActivatedRoute
    @Component({
      standalone: true,
      imports: [AsyncPipe],
      template: `
        search: {{ (route.queryParams | async)?.query }}
      `,
    })
    class SearchCmp {
      constructor(
        readonly route: ActivatedRoute,
        readonly router: Router,
      ) {}

      async searchFor(thing: string) {
        await this.router.navigate([], {queryParams: {query: thing}});
      }
    }

    TestBed.configureTestingModule({
      providers: [provideRouter([{path: 'search', component: SearchCmp}])],
    });

    const harness = await RouterTestingHarness.create();
    const activatedComponent = await harness.navigateByUrl('/search', SearchCmp);
    await activatedComponent.searchFor('books');
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toEqual('/search?query=books');
    expect(harness.routeNativeElement?.innerHTML).toContain('books');
    // #enddocregion
  });
});

