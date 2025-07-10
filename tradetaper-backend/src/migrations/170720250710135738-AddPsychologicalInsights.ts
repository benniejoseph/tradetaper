
import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableColumn } from "typeorm";

export class AddPsychologicalInsights20250710135738 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "psychological_insights",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "uuid",
                },
                {
                    name: "user_id",
                    type: "uuid",
                    isNullable: false,
                },
                {
                    name: "note_id",
                    type: "uuid",
                    isNullable: true,
                },
                {
                    name: "insight_type",
                    type: "varchar",
                    length: "255",
                    isNullable: false,
                },
                {
                    name: "sentiment",
                    type: "varchar",
                    length: "255",
                    isNullable: true,
                },
                {
                    name: "confidence_score",
                    type: "float",
                    isNullable: true,
                },
                {
                    name: "extracted_text",
                    type: "text",
                    isNullable: true,
                },
                {
                    name: "analysis_date",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP",
                },
                {
                    name: "raw_gemini_response",
                    type: "jsonb",
                    isNullable: true,
                },
            ],
        }), true);

        await queryRunner.createForeignKey("psychological_insights", new TableForeignKey({
            columnNames: ["user_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "users",
            onDelete: "CASCADE",
        }));

        await queryRunner.createForeignKey("psychological_insights", new TableForeignKey({
            columnNames: ["note_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "notes",
            onDelete: "SET NULL",
        }));

        // Add chart_image_url to trades table
        await queryRunner.addColumn("trades", new TableColumn({
            name: "chart_image_url",
            type: "varchar",
            length: "2048",
            isNullable: true,
        }));

        // Add chart_analysis_data to notes table
        await queryRunner.addColumn("notes", new TableColumn({
            name: "chart_analysis_data",
            type: "jsonb",
            isNullable: true,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys first
        const table = await queryRunner.getTable("psychological_insights");
        const foreignKeyUser = table.foreignKeys.find(fk => fk.columnNames.indexOf("user_id") !== -1);
        const foreignKeyNote = table.foreignKeys.find(fk => fk.columnNames.indexOf("note_id") !== -1);

        if (foreignKeyUser) {
            await queryRunner.dropForeignKey("psychological_insights", foreignKeyUser);
        }
        if (foreignKeyNote) {
            await queryRunner.dropForeignKey("psychological_insights", foreignKeyNote);
        }

        await queryRunner.dropTable("psychological_insights");

        // Remove columns from trades and notes tables
        await queryRunner.dropColumn("trades", "chart_image_url");
        await queryRunner.dropColumn("notes", "chart_analysis_data");
    }

}
