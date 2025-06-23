/**
 * 이 파일은 아이모듈 FAQ모듈의 일부입니다. (https://www.imodules.io)
 *
 * 사이트관리화면을 구성한다.
 *
 * @file /modules/faq/admin/scripts/contexts/faqs.ts
 * @author Arzz <arzz@arzz.com>
 * @license MIT License
 * @modified 2024. 4. 23.
 */
Admin.ready(async () => {
    const me = Admin.getModule('faq') as modules.faq.admin.Faq;

    return new Aui.Panel({
        id: 'faqs-context',
        border: false,
        layout: 'column',
        iconClass: 'mi mi-lightbulb-on',
        title: await me.getText('admin.contexts.faqs'),
        scrollable: true,
        items: [
            new Aui.Grid.Panel({
                id: 'faqs',
                border: [false, true, false, false],
                width: 240,
                minWidth: 240,
                maxWidth: 400,
                resizable: [false, true, false, false],
                columnResizable: false,
                selection: { selectable: true },
                topbar: [
                    new Aui.Form.Field.Search({
                        name: 'keyword',
                        flex: 1,
                        emptyText: await me.getText('keyword'),
                        liveSearch: true,
                        handler: async (keyword, field) => {
                            const grid = field.getParent().getParent() as Aui.Grid.Panel;
                            if (keyword.length > 0) {
                                grid.getStore().setFilters(
                                    {
                                        title: { value: keyword, operator: 'likecode' },
                                        faq_id: { value: keyword, operator: 'likecode' },
                                    },
                                    'OR'
                                );
                            } else {
                                grid.getStore().resetFilters();
                            }
                        },
                    }),
                    new Aui.Button({
                        iconClass: 'mi mi-plus',
                        text: await me.getText('admin.faqs.add'),
                        handler: () => {
                            me.faqs.add();
                        },
                    }),
                ],
                bottombar: [
                    new Aui.Button({
                        iconClass: 'mi mi-refresh',
                        handler: (button) => {
                            const grid = button.getParent().getParent() as Aui.Grid.Panel;
                            grid.getStore().reload();
                        },
                    }),
                ],
                store: new Aui.Store.Remote({
                    url: me.getProcessUrl('faqs'),
                    primaryKeys: ['faq_id'],
                    sorters: { title: 'ASC' },
                }),
                columns: [
                    {
                        text: await me.getText('admin.faqs.title'),
                        dataIndex: 'title',
                    },
                ],
                listeners: {
                    update: (grid) => {
                        if (Admin.getContextSubUrl(0) !== null && grid.getSelections().length == 0) {
                            grid.select({ faq_id: Admin.getContextSubUrl(0) });

                            if (grid.getSelections().length == 0 && grid.getStore().getCount() > 0) {
                                grid.selectRow(0);
                            }
                        }
                    },
                    openItem: (record) => {
                        me.faqs.add(record.get('faq_id'));
                    },
                    openMenu: (menu, record) => {
                        menu.setTitle(record.get('title'));

                        menu.add({
                            text: me.printText('admin.faqs.edit'),
                            iconClass: 'mi mi-edit',
                            handler: async () => {
                                me.faqs.add(record.get('faq_id'));
                                return true;
                            },
                        });

                        menu.add({
                            text: me.printText('admin.faqs.delete'),
                            iconClass: 'mi mi-trash',
                            handler: async () => {
                                me.faqs.delete(record.get('faq_id'));
                                return true;
                            },
                        });
                    },
                    selectionChange: (selections) => {
                        const categories = Aui.getComponent('categories') as Aui.Grid.Panel;
                        if (selections.length == 1) {
                            const faq_id = selections[0].get('faq_id');
                            categories.getStore().setParams({ faq_id: faq_id });
                            categories.getStore().reload();
                            categories.enable();

                            Aui.getComponent('faqs-context').properties.setUrl();
                        } else {
                            if (categories.getStore().isLoaded() == true) {
                                categories.getStore().empty();
                            }
                            categories.disable();
                        }
                    },
                },
            }),
            new Aui.Tree.Panel({
                id: 'categories',
                border: [false, true, false, true],
                flex: 2,
                minWidth: 380,
                maxWidth: 500,
                resizable: [false, true, false, false],
                columnResizable: true,
                selection: { selectable: true },
                disabled: true,
                autoLoad: false,
                topbar: [
                    new Aui.Form.Field.Search({
                        name: 'keyword',
                        width: 200,
                        emptyText: await me.getText('keyword'),
                        liveSearch: true,
                        handler: async (keyword, field) => {
                            const tree = field.getParent().getParent() as Aui.Tree.Panel;
                            if (keyword.length > 0) {
                                tree.getStore().setFilters(
                                    {
                                        title: { value: keyword, operator: 'likecode' },
                                    },
                                    'OR'
                                );
                            } else {
                                tree.getStore().resetFilters();
                            }
                        },
                    }),
                    '->',
                    new Aui.Button({
                        iconClass: 'mi mi-plus',
                        text: await me.getText('admin.contents.add'),
                        handler: () => {
                            me.categories.add();
                        },
                    }),
                ],
                bottombar: [
                    new Aui.Button({
                        iconClass: 'mi mi-caret-up',
                        handler: async (button) => {
                            button.setLoading(true);
                            const tree = button.getParent().getParent() as Aui.Tree.Panel;
                            tree.moveSelections('up');

                            await tree.getStore().commit();
                            tree.restoreSelections();
                            button.setLoading(false);
                        },
                    }),
                    new Aui.Button({
                        iconClass: 'mi mi-caret-down',
                        handler: async (button) => {
                            button.setLoading(true);
                            const tree = button.getParent().getParent() as Aui.Tree.Panel;
                            tree.moveSelections('down');

                            await tree.getStore().commit();
                            tree.restoreSelections();
                            button.setLoading(false);
                        },
                    }),
                    '|',
                    new Aui.Button({
                        iconClass: 'mi mi-refresh',
                        handler: (button) => {
                            const tree = button.getParent().getParent() as Aui.Tree.Panel;
                            tree.getStore().reload();
                        },
                    }),
                    '->',
                    new Aui.Form.Field.Select({
                        width: 120,
                        store: new Aui.Store.Local({
                            fields: [{ name: 'value', type: 'int' }, 'display'],
                            records: [],
                        }),
                        valueField: 'value',
                        displayField: 'display',
                        listeners: {
                            change: (field, value) => {
                                const grid = field.getParent().getParent() as Aui.Grid.Panel;
                                if (grid.getStore().getParam('version') != value) {
                                    grid.getStore().setParam('version', value);
                                    grid.getStore().reload();
                                }
                            },
                        },
                    }),
                ],
                store: new Aui.TreeStore.Remote({
                    url: me.getProcessUrl('contents'),
                    primaryKeys: ['category_id'],
                    sorters: { sort: 'ASC' },
                }),
                columns: [
                    {
                        text: await me.getText('admin.contents.title'),
                        dataIndex: 'title',
                        flex: 1,
                    },
                    {
                        text: await me.getText('admin.contents.documents'),
                        dataIndex: 'documents',
                        width: 60,
                        textAlign: 'right',
                        renderer: (value) => {
                            return Format.number(value);
                        },
                    },
                    {
                        text: await me.getText('admin.contents.hits'),
                        dataIndex: 'hits',
                        width: 75,
                        textAlign: 'right',
                        renderer: (value) => {
                            return Format.number(value);
                        },
                    },
                ],
                listeners: {
                    update: (tree) => {
                        if (Admin.getContextSubUrl(1) !== null && tree.getSelections().length == 0) {
                            tree.select({
                                faq_id: Admin.getContextSubUrl(0),
                                category_id: Admin.getContextSubUrl(1),
                            });

                            if (tree.getSelections().length == 0 && tree.getStore().getCount() > 0) {
                                tree.selectRow([0]);
                            }
                        }
                    },
                    openItem: (record) => {
                        me.categories.add(record.get('category_id'));
                    },
                    openMenu: (menu, record) => {
                        menu.setTitle(record.get('title'));

                        menu.add({
                            text: me.printText('admin.contents.edit'),
                            iconClass: 'mi mi-edit',
                            handler: async () => {
                                me.categories.add(record.get('category_id'));
                                return true;
                            },
                        });

                        menu.add({
                            text: me.printText('admin.contents.delete'),
                            iconClass: 'mi mi-trash',
                            handler: async () => {
                                me.categories.delete(record.get('category_id'));
                                return true;
                            },
                        });
                    },
                    selectionChange: (selections, tree) => {
                        const documents = Aui.getComponent('documents') as Aui.Grid.Panel;
                        if (selections.length == 1) {
                            const faq_id = selections[0].get('faq_id');
                            const category_id = selections[0].get('category_id');
                            const has_version = tree.getStore().getParam('has_version') == 'TRUE';
                            const version = tree.getStore().getParam('version') ?? -1;
                            documents.getStore().setParams({
                                faq_id: faq_id,
                                category_id: category_id,
                                has_version: has_version == true ? 'TRUE' : 'FALSE',
                                version: version,
                            });
                            documents.getStore().reload();
                            documents.enable();

                            Aui.getComponent('faqs-context').properties.setUrl();
                        } else {
                            if (documents.getStore().isLoaded() == true) {
                                documents.getStore().empty();
                            }
                            documents.disable();
                        }
                    },
                },
            }),
            new Aui.Grid.Panel({
                id: 'documents',
                border: [false, true, false, true],
                minWidth: 280,
                flex: 3,
                columnResizable: false,
                selection: { selectable: true },
                disabled: true,
                autoLoad: false,
                topbar: [
                    new Aui.Button({
                        iconClass: 'mi mi-plus',
                        text: await me.getText('admin.documents.add'),
                        handler: () => {
                            me.documents.add();
                        },
                    }),
                ],
                bottombar: [
                    new Aui.Button({
                        iconClass: 'mi mi-refresh',
                        handler: (button) => {
                            const grid = button.getParent().getParent() as Aui.Grid.Panel;
                            grid.getStore().reload();
                        },
                    }),
                ],
                store: new Aui.Store.Remote({
                    url: me.getProcessUrl('documents'),
                    fields: [
                        { name: 'start_version', type: 'int' },
                        { name: 'end_version', type: 'int' },
                    ],
                    primaryKeys: ['start_version'],
                    sorters: { start_version: 'DESC' },
                }),
                columns: [
                    {
                        text: await me.getText('admin.documents.start_version'),
                        dataIndex: 'start_version',
                        textAlign: 'center',
                        width: 70,
                        renderer: (value) => {
                            if (value == -1) {
                                return '*';
                            }
                            return Math.floor(value / 1000) + '.' + (value % 1000);
                        },
                    },
                    {
                        text: await me.getText('admin.documents.end_version'),
                        dataIndex: 'end_version',
                        textAlign: 'center',
                        width: 70,
                        renderer: (value) => {
                            if (value == -1) {
                                return '*';
                            }
                            return Math.floor(value / 1000) + '.' + (value % 1000);
                        },
                    },
                    {
                        text: await me.getText('admin.documents.author'),
                        dataIndex: 'author',
                        minWidth: 120,
                        flex: 1,
                        renderer: (value) => {
                            return (
                                '<i class="photo" style="background-image:url(' + value.photo + ');"></i>' + value.name
                            );
                        },
                    },
                    {
                        text: await me.getText('admin.documents.updated_at'),
                        dataIndex: 'updated_at',
                        width: 145,
                        textAlign: 'center',
                        renderer: (value) => {
                            return Format.date('Y.m.d(D) H:i', value);
                        },
                    },
                    {
                        text: await me.getText('admin.documents.hits'),
                        dataIndex: 'hits',
                        width: 75,
                        textAlign: 'right',
                        renderer: (value) => {
                            return Format.number(value);
                        },
                    },
                ],
                listeners: {
                    load: (grid) => {
                        if (grid.getStore().getParam('has_version') == 'FALSE') {
                            grid.getColumnByIndex(0).setHidden(true);
                            grid.getColumnByIndex(1).setHidden(true);
                        }
                    },
                    openItem: (record) => {
                        me.documents.add(record.get('start_version'));
                    },
                    openMenu: (menu, record) => {
                        if (record.get('start_version') == -1) {
                            menu.setTitle(me.printText('admin.versions.all_version'));
                        } else {
                            menu.setTitle(
                                Math.floor(record.get('start_version') / 1000) +
                                    '.' +
                                    (record.get('start_version') % 1000)
                            );
                        }

                        menu.add({
                            text: me.printText('admin.documents.edit'),
                            iconClass: 'mi mi-edit',
                            handler: async () => {
                                me.documents.add(record.get('start_version'));
                                return true;
                            },
                        });

                        menu.add({
                            text: me.printText('admin.documents.delete'),
                            iconClass: 'mi mi-trash',
                            handler: async () => {
                                me.documents.delete();
                                return true;
                            },
                        });
                    },
                },
            }),
        ],
        setUrl: () => {
            const faqs = Aui.getComponent('faqs') as Aui.Grid.Panel;
            const faq_id = faqs.getSelections().at(0)?.get('faq_id') ?? null;

            if (Admin.getContextSubUrl(0) !== faq_id) {
                Admin.setContextSubUrl('/' + faq_id);
            }

            const categories = Aui.getComponent('categories') as Aui.Grid.Panel;
            const category_id = categories.getSelections().at(0)?.get('category_id') ?? null;

            if (category_id !== null && Admin.getContextSubUrl(1) !== category_id) {
                Admin.setContextSubUrl('/' + faq_id + '/' + category_id);
            }
        },
    });
});
