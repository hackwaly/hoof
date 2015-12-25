import {React, stored, computed, commit, Fragment, dynamicList, render, waitForNextReflow} from '../../src/library';

let databases = stored(ENV.generateData().toArray());
let template = <table class="table table-striped latest-data">
    <tbody data-bind="foreach: databases">
    {dynamicList(databases, (db) => {
        let dbname = computed(() => db().dbname);
        let nbQueries = computed(() => db().lastSample.nbQueries);
        let countClassName = computed(() => db().lastSample.countClassName);
        let topFiveQueries = computed(() => db().lastSample.topFiveQueries);
        return <tr>
            <td class="dbname">{dbname}</td>
            <td class="query-count">
                <span class={countClassName}>{nbQueries}</span>
            </td>
            {dynamicList(topFiveQueries, (query) => {
                let text = computed(() => query().query);
                let formatElapsed = computed(() => query().formatElapsed);
                let elapsedClassName = computed(() => query().elapsedClassName);
                return <td class={elapsedClassName}>
                    {formatElapsed}
                    <div class="popover left">
                        <div class="popover-content">{text}</div>
                        <div class="arrow"></div>
                    </div>
                </td>;
            })}
        </tr>;
    })}
    </tbody>
</table>;

let ctx = render(template);
document.querySelector('#container').appendChild(ctx.node);
ctx.setup();

function ping() {
    Monitoring.renderRate.ping();
    waitForNextReflow(ping);
}

let load = () => {
    databases.set(ENV.generateData(true).toArray());
    setTimeout(load, ENV.timeout);
};
load();
ping();