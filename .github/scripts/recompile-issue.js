// Shared by both jobs in regenerate-on-release.yml. Files a checklist item
// against one persistent tracking issue rather than opening a new issue per
// release — recompiling the running NoSketch Engine instance stays a manual
// step (a GitHub Actions runner has no access to that host); see
// docs/modules/nosketch/pages/technical.adoc#production-deployment.
//
//   - An open issue with `label` already exists  -> comment the item on it.
//   - The most recent issue with `label` is closed -> reopen it, then comment.
//   - No issue with `label` exists yet            -> create one, with the
//     item as its initial body, labeled and assigned.
//
// Never opens more than one issue at a time: at most one open issue with
// `label` exists after this runs, and its checklist is the current list of
// corpora waiting on a manual recompile.

async function fileRecompileItem(github, context, core, { label, assignee, item }) {
  const { owner, repo } = context.repo;
  const line = `- [ ] ${item}`;

  // Issue creation/update rejects a label that doesn't exist yet in the
  // repo — create it (idempotent: ignore "already exists").
  try {
    await github.rest.issues.createLabel({
      owner, repo, name: label, color: "d93f0b",
      description: "A corpus was regenerated and still needs a manual recompile + redeploy",
    });
    core.info(`Created label "${label}"`);
  } catch (err) {
    if (err.status !== 422) throw err;
  }

  const open = await github.rest.issues.listForRepo({
    owner, repo, state: "open", labels: label, per_page: 1,
  });
  if (open.data.length > 0) {
    const issue = open.data[0];
    await github.rest.issues.createComment({
      owner, repo, issue_number: issue.number, body: line,
    });
    core.info(`Added item to open issue #${issue.number}`);
    return;
  }

  const closed = await github.rest.issues.listForRepo({
    owner, repo, state: "closed", labels: label, per_page: 1,
    sort: "updated", direction: "desc",
  });
  if (closed.data.length > 0) {
    const issue = closed.data[0];
    await github.rest.issues.update({
      owner, repo, issue_number: issue.number, state: "open",
    });
    await github.rest.issues.createComment({
      owner, repo, issue_number: issue.number, body: line,
    });
    core.info(`Reopened issue #${issue.number} and added item`);
    return;
  }

  const created = await github.rest.issues.create({
    owner, repo,
    title: "Corpora pending recompilation",
    body: [
      "Auto-filed by `regenerate-on-release.yml` whenever a corpus's " +
        "`vertical/source` (or the KIParla aggregate) is regenerated. Each " +
        "line still needs `make compile-<corpus>` — and, once ready, a " +
        "production redeploy — run manually. See " +
        "docs/modules/nosketch/pages/technical.adoc#production-deployment.",
      "",
      line,
    ].join("\n"),
    labels: [label],
    assignees: assignee ? [assignee] : [],
  });
  core.info(`Filed new issue #${created.data.number}`);
}

module.exports = { fileRecompileItem };
